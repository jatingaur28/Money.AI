/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParsedUPIPayload, PreflightAnalysis, PreflightRiskIndicator } from '../types/intelligence';

// Common Indian bank handles and legitimate domains
const KNOWN_LEGITIMATE_MERCHANTS = new Set([
  'swiggy@icici',
  'zomato@hdfcbank',
  'flipkart@axisbank',
  'amazonpay@apl',
  'netflix@icici',
  'hotstar@axisbank',
  'tatapower@icici',
  'actfibernet@kotak',
  'zerodha@icici',
  'groww@hdfcbank',
]);

const COERCIVE_KEYWORDS = [
  'electricity will be disconnected',
  'power cut tonight',
  'account blocked',
  'kyc suspended',
  'pan not linked',
  'refund claim immediately',
  'lottery reward',
  'income tax refund credited',
  'pay within 15 minutes',
  'urgent verification required',
  'rbi fine penalty',
  'challan pending arrest',
];

/**
 * Safely decodes a UPI QR code string without executing it.
 */
export function parseUPIString(rawInput: string): ParsedUPIPayload | null {
  const trimmed = rawInput.trim();
  
  // 1. Look for embedded upi://pay? anywhere in text
  const match = trimmed.match(/upi:\/\/pay\?[^\s"'>]+/i);
  if (match) {
    try {
      const uri = match[0];
      const queryPart = uri.substring(uri.indexOf('?') + 1);
      const params = new URLSearchParams(queryPart);

      const vpa = params.get('pa') || '';
      if (vpa) {
        const amountStr = params.get('am');
        const amount = amountStr ? parseFloat(amountStr) : undefined;

        return {
          vpa,
          payeeName: params.get('pn') ? decodeURIComponent(params.get('pn')!) : undefined,
          merchantCode: params.get('mc') || undefined,
          amount: amount !== undefined && !isNaN(amount) ? amount : undefined,
          transactionRef: params.get('tr') || undefined,
          url: params.get('url') || undefined,
          rawPayload: uri,
        };
      }
    } catch {
      // Continue to fallback
    }
  }

  // 2. Check for standalone or embedded VPA format: e.g. "someone@okaxis"
  const vpaMatch = trimmed.match(/[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/);
  if (vpaMatch) {
    return {
      vpa: vpaMatch[0],
      rawPayload: vpaMatch[0],
    };
  }

  return null;
}

/**
 * Checks for Cyrillic or non-ASCII homograph characters in hostnames.
 */
export function checkHomograph(urlOrDomain: string): boolean {
  try {
    let hostname = urlOrDomain;
    if (urlOrDomain.startsWith('http://') || urlOrDomain.startsWith('https://')) {
      hostname = new URL(urlOrDomain).hostname;
    }
    // Check if contains non-ASCII characters that mimic Latin
    for (let i = 0; i < hostname.length; i++) {
      const code = hostname.charCodeAt(i);
      if (code > 127) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Comprehensive preflight evaluation for a payment link, QR, or text intent.
 */
export function evaluatePaymentPreflight(input: {
  rawInput: string;
  contextNote?: string;
  expectedMerchant?: string;
}): PreflightAnalysis {
  const { rawInput, contextNote = '', expectedMerchant } = input;
  const flags: PreflightRiskIndicator[] = [];
  const parsedUpi = parseUPIString(rawInput);

  let targetVpa = parsedUpi?.vpa || '';
  let targetPayee = parsedUpi?.payeeName || expectedMerchant || 'Unknown Payee';
  let requestedAmount = parsedUpi?.amount;

  // 1. Text coercion & urgency detection
  const combinedText = `${rawInput} ${contextNote}`.toLowerCase();
  for (const keyword of COERCIVE_KEYWORDS) {
    if (combinedText.includes(keyword)) {
      flags.push({
        ruleId: 'PREFLIGHT_URGENCY_INJECTION',
        category: 'URGENCY_INJECTION',
        severity: 'BLOCK',
        description: 'Coercive urgency language detected commonly used in electricity / KYC phishing campaigns.',
        evidence: `Triggered phrase: "${keyword}"`,
      });
      break;
    }
  }

  // 2. Homograph / Suspicious Domain Check
  if (rawInput.includes('http://') || rawInput.includes('https://') || parsedUpi?.url) {
    const candidateUrl = parsedUpi?.url || rawInput;
    if (checkHomograph(candidateUrl)) {
      flags.push({
        ruleId: 'PREFLIGHT_HOMOGRAPH_SPOOF',
        category: 'HOMOGRAPH_DOMAIN',
        severity: 'BLOCK',
        description: 'URL contains invisible or non-ASCII homoglyphs designed to visually spoof legitimate banking domains.',
        evidence: candidateUrl,
      });
    }

    if (candidateUrl.includes('sbi') && !candidateUrl.includes('onlinesbi.sbi') && !candidateUrl.includes('sbi.co.in')) {
      flags.push({
        ruleId: 'PREFLIGHT_BRAND_MISMATCH_SBI',
        category: 'PAYEE_MISMATCH',
        severity: 'BLOCK',
        description: 'Domain masquerades as State Bank of India but is registered on an unverified 3rd-party registrar.',
        evidence: candidateUrl,
      });
    }
  }

  // 3. VPA Specific Checks
  if (targetVpa) {
    const vpaLower = targetVpa.toLowerCase();

    // Check for deceptive impersonation handles (e.g. "hdfc-refund-support@okaxis")
    const bankKeywords = ['hdfc', 'sbi', 'icici', 'axis', 'paytm', 'rbi', 'refund', 'support', 'kyc'];
    const matchedKeywords = bankKeywords.filter(k => vpaLower.includes(k));

    if (matchedKeywords.length >= 2 && !KNOWN_LEGITIMATE_MERCHANTS.has(vpaLower)) {
      flags.push({
        ruleId: 'PREFLIGHT_VPA_IMPERSONATION',
        category: 'SUSPICIOUS_VPA',
        severity: 'BLOCK',
        description: 'VPA uses multiple institutional bank/refund brand tokens but is hosted on a consumer UPI handle.',
        evidence: `VPA: ${targetVpa} (contains: ${matchedKeywords.join(', ')})`,
      });
    }

    // Check for payee name mismatch if expected merchant was specified
    if (expectedMerchant && targetPayee !== 'Unknown Payee') {
      const expNorm = expectedMerchant.toLowerCase().replace(/[^a-z0-9]/g, '');
      const actualNorm = targetPayee.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (!actualNorm.includes(expNorm) && !expNorm.includes(actualNorm)) {
        flags.push({
          ruleId: 'PREFLIGHT_PAYEE_NAME_MISMATCH',
          category: 'PAYEE_MISMATCH',
          severity: 'WARNING',
          description: `Intended merchant is "${expectedMerchant}", but the QR registers recipient as "${targetPayee}".`,
          evidence: `Expected: ${expectedMerchant} != Registered: ${targetPayee}`,
        });
      }
    }
  }

  // 4. Calculate Risk Score & Verdict
  const blockCount = flags.filter(f => f.severity === 'BLOCK').length;
  const warningCount = flags.filter(f => f.severity === 'WARNING').length;

  let riskScore = 5;
  let verdict: PreflightAnalysis['verdict'] = 'CLEAN';
  let safeNextStep = 'Proceed safely through authorized UPI app. Verify payee name on your banking screen.';

  if (blockCount > 0) {
    verdict = 'DANGEROUS';
    riskScore = Math.min(100, 70 + blockCount * 15 + warningCount * 5);
    safeNextStep = 'DO NOT PROCEED. Do not enter UPI PIN or approve mandate. Report this handle as malicious.';
  } else if (warningCount > 0) {
    verdict = 'CAUTION';
    riskScore = Math.min(65, 30 + warningCount * 15);
    safeNextStep = 'Exercise caution: Verify payee identity with merchant directly via official app before confirming.';
  }

  // Intent summary
  let intentSummary = '';
  if (requestedAmount) {
    intentSummary = `Request to debit ₹${requestedAmount.toLocaleString('en-IN')} to "${targetPayee}" (${targetVpa || 'Direct Gateway'})`;
  } else {
    intentSummary = `Payment link/QR addressing "${targetPayee}" (${targetVpa || 'Dynamic checkout'})`;
  }

  return {
    id: `preflight-${Date.now()}`,
    analyzedAt: new Date().toISOString(),
    targetPayee,
    targetVpa,
    requestedAmount,
    currency: 'INR',
    intentSummary,
    verdict,
    riskScore,
    flags,
    parsedUpi: parsedUpi || undefined,
    safeNextStep,
  };
}
