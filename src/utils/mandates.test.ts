import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRbiMandateRules,
  generateNpciUmn,
  canTransitionMandate,
  computeNextBillingDate,
  RBI_STANDARD_AFA_CAP,
  RBI_HIGH_VALUE_EXEMPT_CAP,
} from './mandates';

test('RBI Mandate: Standard subscription under ₹15,000 passes compliance without per-cycle OTP', () => {
  const result = validateRbiMandateRules('Entertainment', 1499, 2000, 24);
  assert.equal(result.isCompliant, true);
  assert.equal(result.requiresPerDebitAfa, false);
  assert.equal(result.warnings.length, 0);
});

test('RBI Mandate: Amount above ₹15,000 for standard service flags per-cycle OTP requirement', () => {
  const result = validateRbiMandateRules('Software', 18000, 25000, 24);
  assert.equal(result.requiresPerDebitAfa, true);
  assert.ok(result.warnings.some((w) => w.includes('exceeds RBI AFA exemption limit')));
});

test('RBI Mandate: Mutual fund/Insurance category allows up to ₹1,00,000 cap exemption', () => {
  const result = validateRbiMandateRules('Investment', 25000, 50000, 24);
  assert.equal(result.requiresPerDebitAfa, false);
  assert.equal(result.maxPermissibleLimit, RBI_HIGH_VALUE_EXEMPT_CAP);
});

test('RBI Mandate: Pre-debit alert window less than 24 hours fails compliance', () => {
  const result = validateRbiMandateRules('Entertainment', 500, 500, 12);
  assert.equal(result.isCompliant, false);
  assert.ok(result.warnings.some((w) => w.includes('minimum 24-hour pre-debit notification window')));
});

test('NPCI UMN Generator: Creates formatted Unique Mandate Number containing merchant token', () => {
  const umn = generateNpciUmn('Netflix India', 'HDFC');
  assert.ok(umn.startsWith('UMN-'));
  assert.ok(umn.includes('HDFC'));
  assert.ok(umn.includes('NETFLI'));
});

test('Mandate State Machine: Revoked mandate cannot be paused or modified', () => {
  const pauseCheck = canTransitionMandate('REVOKED', 'PAUSE');
  assert.equal(pauseCheck.allowed, false);

  const modifyCheck = canTransitionMandate('REVOKED', 'MODIFY');
  assert.equal(modifyCheck.allowed, false);
});

test('Mandate State Machine: Active mandate can be paused or revoked', () => {
  const pauseCheck = canTransitionMandate('ACTIVE', 'PAUSE');
  assert.equal(pauseCheck.allowed, true);

  const revokeCheck = canTransitionMandate('ACTIVE', 'REVOKE');
  assert.equal(revokeCheck.allowed, true);
});

test('Billing Date Calculation: Monthly frequency advances exactly 1 month', () => {
  const base = new Date('2026-10-15');
  const next = computeNextBillingDate('Monthly', base);
  assert.equal(next, '2026-11-15');
});
