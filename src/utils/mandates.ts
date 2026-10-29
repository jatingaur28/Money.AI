/**
 * MoneyShield OS — UPI 2.0 AutoPay Mandate Rules & RBI Compliance Engine
 * Conforms to RBI Circulars DPSS.CO.PD.No.447/02.14.003/2019-20 and DPSS.CO.PD.No.1438/02.14.003/2023-24
 */

import { CreateMandateRequest, ModifyMandateRequest, AutoPayMandate } from '../types';

export const RBI_STANDARD_AFA_CAP = 15000; // Standard UPI AutoPay limit without per-transaction OTP
export const RBI_HIGH_VALUE_EXEMPT_CAP = 100000; // Mutual funds, Insurance, Education limit

export interface RbiComplianceCheck {
  isCompliant: boolean;
  requiresPerDebitAfa: boolean;
  warnings: string[];
  maxPermissibleLimit: number;
}

/**
 * Validates mandate parameters against RBI e-Mandate / UPI AutoPay Guidelines
 */
export function validateRbiMandateRules(
  category: CreateMandateRequest['category'],
  amount: number,
  maxCapAmount: number,
  preDebitAlertHours: number
): RbiComplianceCheck {
  const warnings: string[] = [];
  const isHighValueCategory = category === 'Insurance' || category === 'Investment';
  const threshold = isHighValueCategory ? RBI_HIGH_VALUE_EXEMPT_CAP : RBI_STANDARD_AFA_CAP;

  if (amount <= 0) {
    warnings.push('Mandate debit amount must be greater than ₹0.');
  }

  if (maxCapAmount < amount) {
    warnings.push('Maximum authorized cap cannot be less than the initial recurring debit amount.');
  }

  const requiresPerDebitAfa = maxCapAmount > threshold;
  if (requiresPerDebitAfa) {
    warnings.push(
      `Max cap ₹${maxCapAmount.toLocaleString('en-IN')} exceeds RBI AFA exemption limit of ₹${threshold.toLocaleString('en-IN')}. Each recurring debit will require manual OTP authentication.`
    );
  }

  if (preDebitAlertHours < 24) {
    warnings.push('RBI mandate circular strictly requires a minimum 24-hour pre-debit notification window.');
  }

  return {
    isCompliant: warnings.length === 0 || (warnings.length === 1 && requiresPerDebitAfa),
    requiresPerDebitAfa,
    warnings,
    maxPermissibleLimit: threshold,
  };
}

/**
 * Generates an NPCI-compliant Unique Mandate Number (UMN)
 * Format: UMN-{YEAR}-{PSP_CODE}-{HEX}
 */
export function generateNpciUmn(merchantName: string, psp: string = 'NPCI'): string {
  const year = new Date().getFullYear();
  const cleanMerchant = merchantName.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase();
  const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `UMN-${year}-${psp}-${cleanMerchant}-${randomHex}`;
}

/**
 * Validates a state transition on an AutoPay mandate
 */
export function canTransitionMandate(
  currentStatus: AutoPayMandate['status'],
  targetAction: 'PAUSE' | 'RESUME' | 'MODIFY' | 'REVOKE'
): { allowed: boolean; reason?: string } {
  if (currentStatus === 'REVOKED') {
    return {
      allowed: false,
      reason: 'Revoked mandates are permanently terminated at the NPCI clearinghouse and cannot be altered.',
    };
  }

  if (targetAction === 'PAUSE') {
    if (currentStatus === 'PAUSED') {
      return { allowed: false, reason: 'Mandate is already paused.' };
    }
    return { allowed: true };
  }

  if (targetAction === 'RESUME') {
    if (currentStatus !== 'PAUSED') {
      return { allowed: false, reason: 'Only paused mandates can be resumed.' };
    }
    return { allowed: true };
  }

  if (targetAction === 'MODIFY') {
    if (currentStatus === 'PAUSED') {
      return { allowed: false, reason: 'Please resume the mandate before modifying terms.' };
    }
    return { allowed: true };
  }

  if (targetAction === 'REVOKE') {
    return { allowed: true }; // Any active, flagged, or paused mandate can be revoked anytime
  }

  return { allowed: true };
}

/**
 * Computes next billing date based on frequency and current date
 */
export function computeNextBillingDate(frequency: AutoPayMandate['frequency'], fromDate: Date = new Date()): string {
  const d = new Date(fromDate);
  if (frequency === 'Weekly') {
    d.setDate(d.getDate() + 7);
  } else if (frequency === 'Monthly') {
    d.setMonth(d.getMonth() + 1);
  } else if (frequency === 'Quarterly') {
    d.setMonth(d.getMonth() + 3);
  } else if (frequency === 'Yearly') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setDate(d.getDate() + 30);
  }
  return d.toISOString().split('T')[0];
}
