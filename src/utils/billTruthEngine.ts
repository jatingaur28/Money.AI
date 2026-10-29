/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BillDriftItem, DisputePacket } from '../types/intelligence';
import { Transaction, UpiMandate } from '../types';

/**
 * Scans transactions and active mandates to identify pricing contract drift.
 */
export function auditBillTruthAndDrift(params: {
  mandates: UpiMandate[];
  transactions: Transaction[];
}): BillDriftItem[] {
  const { mandates, transactions } = params;
  const driftItems: BillDriftItem[] = [];

  mandates.forEach(m => {
    // Find matching transactions for this merchant
    const merchantTx = transactions.filter(
      t => t.merchantName.toLowerCase().includes(m.merchantName.toLowerCase()) ||
           m.merchantName.toLowerCase().includes(t.merchantName.toLowerCase())
    );

    if (merchantTx.length === 0) return;

    // Check latest transaction amount vs mandate registered amount
    const latestTx = merchantTx[0];
    const originalAmount = m.amount;
    const billedAmount = latestTx.amount;

    if (billedAmount > originalAmount) {
      const variance = billedAmount - originalAmount;
      const variancePct = Math.round((variance / originalAmount) * 100);

      driftItems.push({
        id: `drift-hike-${m.id}`,
        merchant: m.merchantName,
        originalAgreedAmount: originalAmount,
        currentBilledAmount: billedAmount,
        varianceAmount: variance,
        variancePercentage: variancePct,
        detectedDriftType: 'STEALTH_HIKE',
        evidenceDate: latestTx.date,
        umn: m.umn,
        mandateReference: m.id,
        receiptSnippet: `Registered mandate cap: ₹${originalAmount} vs actual card debit: ₹${billedAmount} (Delta +₹${variance})`,
        disputePacketReady: true,
      });
    }

    // Check for duplicate debits within a 48-hour window
    if (merchantTx.length >= 2) {
      const t1 = merchantTx[0];
      const t2 = merchantTx[1];
      const diffHours = Math.abs(new Date(t1.date).getTime() - new Date(t2.date).getTime()) / 3600000;

      if (diffHours < 48 && t1.amount === t2.amount && t1.amount > 0) {
        driftItems.push({
          id: `drift-dup-${m.id}`,
          merchant: m.merchantName,
          originalAgreedAmount: t1.amount,
          currentBilledAmount: t1.amount * 2,
          varianceAmount: t1.amount,
          variancePercentage: 100,
          detectedDriftType: 'DUPLICATE_DEBIT',
          evidenceDate: t1.date,
          umn: m.umn,
          mandateReference: m.id,
          receiptSnippet: `Dual debits of ₹${t1.amount} detected within ${Math.round(diffHours)} hours for single monthly cycle.`,
          disputePacketReady: true,
        });
      }
    }
  });

  // Also check for unnotified trial roll-over or international cross-border markups
  const foreignTx = transactions.filter(t => t.notes?.toLowerCase().includes('usd') || t.notes?.toLowerCase().includes('fx fee'));
  foreignTx.forEach(t => {
    driftItems.push({
      id: `drift-fx-${t.id}`,
      merchant: t.merchantName,
      originalAgreedAmount: Math.round(t.amount * 0.95), // net of markup
      currentBilledAmount: t.amount,
      varianceAmount: Math.round(t.amount * 0.05),
      variancePercentage: 5,
      detectedDriftType: 'FOREIGN_FX_MARKUP',
      evidenceDate: t.date,
      receiptSnippet: `Embedded 3.5% cross-border markup + 18% IGST added on dollar billing without itemized line receipt.`,
      disputePacketReady: true,
    });
  });

  return driftItems;
}

/**
 * Generates an RBI-compliant Dispute Packet with formal legal grounds and ombudsman citations.
 */
export function generateDisputePacket(driftItem: BillDriftItem): DisputePacket {
  const groundsText = driftItem.detectedDriftType === 'STEALTH_HIKE'
    ? `Unauthorized debit amount exceeding registered UPI 2.0 / e-Mandate registered limit without mandatory 24-hour pre-debit alert and explicit customer AFA (Additional Factor of Authentication).`
    : driftItem.detectedDriftType === 'DUPLICATE_DEBIT'
    ? `Multiple debits executed for a single subscription billing cycle in violation of NPCI procedural guidelines.`
    : `Opaque foreign currency conversion markup applied without upfront disclosure at checkout.`;

  const regulatoryRef = 'RBI/2020-21/74 DPSS.CO.OD No.753/06.11.001/2020-21 & Reserve Bank - Integrated Ombudsman Scheme, 2021 (Clause 8(1)(a))';

  const complaintDraft = `To:
The Nodal Grievance Officer,
${driftItem.merchant} & Issuer Bank Escalation Cell

SUBJECT: FORMAL DISPUTE & CHARGEBACK NOTICE — UNAUTHORIZED TRANSACTION DRIFT (RBI CIRCULAR RBI/2020-21/74)

Dear Grievance Officer,

I am writing to formally dispute an unauthorized transaction debited from my account under Unique Mandate Number (UMN): ${driftItem.umn || 'N/A'}.

TRANSACTION DETAILS:
- Merchant: ${driftItem.merchant}
- Date of Debit: ${driftItem.evidenceDate}
- Agreed / Authorized Mandate Amount: ₹${driftItem.originalAgreedAmount.toLocaleString('en-IN')}
- Actual Debited Amount: ₹${driftItem.currentBilledAmount.toLocaleString('en-IN')}
- Disputed Excess: ₹${driftItem.varianceAmount.toLocaleString('en-IN')}

REGULATORY GROUNDS:
Under Reserve Bank of India Master Direction on e-Mandate framework (RBI/2020-21/74), any transaction where the amount is modified or exceeds the registered mandate without explicit customer pre-debit notification (minimum 24 hours prior) and 2-Factor Authentication constitutes an unauthorized debit.

Furthermore, under the RBI Harmonisation of Turn Around Time (TAT) and customer compensation guidelines:
1. Failed or disputed mandate debits must be reversed within T+1 working days.
2. Failure to reverse within prescribed timelines incurs statutory penalty compensation of ₹100/day payable directly to the cardholder.

PRAYER:
1. Immediate reversal and refund of ₹${driftItem.varianceAmount.toLocaleString('en-IN')} to the source account.
2. Restoration of mandate cap to the contracted sum of ₹${driftItem.originalAgreedAmount.toLocaleString('en-IN')} or immediate revoking of UMN.

In the event of non-resolution within 30 days, this grievance will be escalated directly to the RBI Banking Ombudsman with complete audit logs and cryptographic payment traces.

Yours faithfully,
Account Holder / MoneyShield OS Protected User`;

  return {
    id: `disp-${driftItem.id}-${Date.now()}`,
    merchant: driftItem.merchant,
    transactionId: driftItem.mandateReference || `TX-${Date.now().toString().slice(-6)}`,
    umn: driftItem.umn,
    amountDisputed: driftItem.varianceAmount,
    dateDisputed: new Date().toISOString().split('T')[0],
    grounds: groundsText,
    regulatoryReference: regulatoryRef,
    statutoryResolutionWindow: 'T+1 business days (Direct refund) or T+5 days (Ombudsman chargeback)',
    complaintLetterDraft: complaintDraft,
  };
}
