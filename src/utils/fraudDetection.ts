/**
 * MoneyShield OS — Core Heuristics and Zero-Day Fraud Detection Engine
 * High-performance edge analysis with zero server leakage.
 */

export interface FraudAnalysisResult {
  isSuspicious: boolean;
  threatLevel: 'CLEAN' | 'CAUTION' | 'CRITICAL';
  score: number; // 0 - 100 (100 = critical threat)
  flags: string[];
}

/**
 * Checks for Cyrillic and Greek homographs commonly used in phishing domains
 * e.g., using 'а' (Cyrillic \u0430) instead of 'a' (\u0061) in "paytm.com" or "hdfcbank.com"
 */
export function detectHomographAttack(input: string): { hasHomograph: boolean; offendingChars: string[] } {
  const offendingChars: string[] = [];
  // Cyrillic range: \u0400-\u04FF, Greek range: \u0370-\u03FF
  const homographRegex = /[\u0400-\u04FF\u0370-\u03FF]/g;
  let match;
  while ((match = homographRegex.exec(input)) !== null) {
    offendingChars.push(match[0]);
  }
  return {
    hasHomograph: offendingChars.length > 0,
    offendingChars,
  };
}

/**
 * Validates UPI Virtual Payment Address (VPA) structure and flags social engineering handles
 */
export function analyzeUpiVpa(vpa: string): FraudAnalysisResult {
  const flags: string[] = [];
  let score = 0;

  if (!vpa || !vpa.includes('@')) {
    return { isSuspicious: true, threatLevel: 'CAUTION', score: 50, flags: ['Malformed VPA string'] };
  }

  const [username, psp] = vpa.toLowerCase().split('@');

  // Check for corporate impersonation tokens in individual VPAs
  const impersonationTokens = ['refund', 'support', 'helpdesk', 'care', 'cashback', 'lottery', 'winner', 'officer', 'nodal', 'chargeback'];
  for (const token of impersonationTokens) {
    if (username.includes(token)) {
      score += 45;
      flags.push(`Suspicious impersonation keyword: "${token}" detected in handle username`);
    }
  }

  // Check for brand name spoofing (e.g., "swiggy-refund", "gpay-help")
  const brandNames = ['paytm', 'phonepe', 'gpay', 'googlepay', 'swiggy', 'zomato', 'amazon', 'flipkart', 'sbi', 'hdfc', 'icici', 'axis'];
  for (const brand of brandNames) {
    if (username.includes(brand)) {
      // If it has brand AND also refund/support or random digits, high probability of spoofing
      if (impersonationTokens.some(t => username.includes(t)) || /\d{4,}/.test(username)) {
        score += 50;
        flags.push(`Brand spoofing: Unauthorized use of "${brand}" in non-official merchant VPA`);
      }
    }
  }

  // Non-standard PSP handle
  const validCommonPsps = ['okhdfcbank', 'okaxis', 'okicici', 'oksbi', 'paytm', 'ybl', 'ibl', 'axl', 'apl', 'upi'];
  if (!validCommonPsps.includes(psp) && !psp.endsWith('bank')) {
    score += 15;
    flags.push(`Uncommon or custom PSP identifier: "@${psp}"`);
  }

  score = Math.min(100, score);
  const threatLevel = score >= 70 ? 'CRITICAL' : score >= 35 ? 'CAUTION' : 'CLEAN';

  return {
    isSuspicious: score >= 35,
    threatLevel,
    score,
    flags,
  };
}

/**
 * Fast SMS Scam and Phishing Heuristic Scorer
 */
export function scoreSmsPayload(smsText: string): FraudAnalysisResult {
  const flags: string[] = [];
  let score = 0;
  const lower = smsText.toLowerCase();

  // 1. Electricity / Utility disconnection threats (extremely common in India)
  if (lower.includes('electricity') && (lower.includes('disconnect') || lower.includes('cut') || lower.includes('bill unpaid') || lower.includes('tonight 9:30'))) {
    score += 85;
    flags.push('High-risk electricity disconnection extortion script');
  }

  // 2. Urgent KYC suspension
  if ((lower.includes('kyc') || lower.includes('pan')) && (lower.includes('block') || lower.includes('suspend') || lower.includes('deactivate') || lower.includes('immediately'))) {
    score += 75;
    flags.push('Banking KYC panic extortion script');
  }

  // 3. Dangerous APK downloads / Remote Access
  if (lower.includes('.apk') || lower.includes('anydesk') || lower.includes('teamviewer') || lower.includes('rustdesk') || lower.includes('quicksupport')) {
    score += 90;
    flags.push('Remote desktop / Malicious APK payload installation prompt');
  }

  // 4. Lottery or high cashback
  if ((lower.includes('kbc') || lower.includes('lottery') || lower.includes('prize') || lower.includes('won 25,00,000')) && lower.includes('whatsapp')) {
    score += 80;
    flags.push('Advance-fee lottery / KBC fraud script');
  }

  // 5. Shortened / Obfuscated links
  if (/bit\.ly|tinyurl\.com|t\.co|is\.gd|cutt\.ly|qr\.net/i.test(smsText)) {
    score += 25;
    flags.push('Obfuscated link shortener detected in message');
  }

  score = Math.min(100, score);
  const threatLevel = score >= 65 ? 'CRITICAL' : score >= 30 ? 'CAUTION' : 'CLEAN';

  return {
    isSuspicious: score >= 30,
    threatLevel,
    score,
    flags,
  };
}
