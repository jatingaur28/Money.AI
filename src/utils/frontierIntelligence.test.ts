/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildCoverageAudit } from './intelligenceEngine';
import { detectCashFlowCollisions } from './cashFlowRadar';
import { evaluatePaymentPreflight, parseUPIString } from './paymentPreflight';
import { auditBillTruthAndDrift, generateDisputePacket } from './billTruthEngine';
import { simulateDigitalTwin } from './digitalTwin';
import { prepareActionPlan, executeActionPlan } from './safeActionProtocol';
import { InvestmentAsset, LasLoan, Transaction, UpiMandate } from '../types';

describe('Frontier Intelligence Layer Unit Tests', () => {

  // 1. Confidence & Coverage Map
  test('Coverage Map accurately reflects unlinked and stale domains', () => {
    const dummyTx: Transaction[] = [
      {
        id: 'tx-1',
        amount: 2500,
        merchantName: 'Amazon India',
        category: 'SHOPPING',
        date: new Date().toISOString(),
        paymentMethod: 'UPI',
        status: 'CLEAN',
      },
    ];

    const dummyMandates: UpiMandate[] = [
      {
        id: 'man-1',
        merchantName: 'Netflix India',
        category: 'ENTERTAINMENT',
        amount: 649,
        amountRule: 'EXACT',
        frequency: 'MONTHLY',
        startDate: '2025-01-01',
        endDate: '2027-01-01',
        nextDebitDate: '2026-11-05',
        status: 'ACTIVE',
        umn: 'UMN1234567890@icici',
        preDebitNotificationDays: 2,
        rbiCompliant: true,
      },
    ];

    const audit = buildCoverageAudit({
      transactions: dummyTx,
      mandates: dummyMandates,
      assets: [],
      lasLoans: [],
    });

    assert.ok(audit.overallCoverageScore > 0 && audit.overallCoverageScore <= 100);
    assert.strictEqual(audit.verifiedFactsCount >= 2, true);
    assert.strictEqual(audit.highPriorityGaps.length >= 1, true);
    assert.ok(audit.items.some(i => i.domain === 'BANK_ACCOUNTS' && i.status === 'STALE'));
    assert.ok(audit.items.some(i => i.domain === 'INSURANCE' && i.status === 'MISSING'));
  });

  // 2. Cash-Flow Collision Radar
  test('Cash-flow radar detects shortfall collision when debits precede salary', () => {
    const dummyMandates: UpiMandate[] = [
      {
        id: 'man-rent',
        merchantName: 'Landlord Rent Transfer',
        category: 'UTILITY',
        amount: 45000,
        amountRule: 'EXACT',
        frequency: 'MONTHLY',
        startDate: '2025-01-01',
        endDate: '2027-01-01',
        nextDebitDate: '2026-11-03',
        status: 'ACTIVE',
        umn: 'UMNRENT1234@hdfc',
        preDebitNotificationDays: 2,
        rbiCompliant: true,
      },
      {
        id: 'man-car-emi',
        merchantName: 'HDFC Car Loan EMI',
        category: 'SUBSCRIPTION',
        amount: 18500,
        amountRule: 'EXACT',
        frequency: 'MONTHLY',
        startDate: '2025-01-01',
        endDate: '2027-01-01',
        nextDebitDate: '2026-11-03',
        status: 'ACTIVE',
        umn: 'UMNCAR9876@hdfc',
        preDebitNotificationDays: 2,
        rbiCompliant: true,
      },
    ];

    const collisions = detectCashFlowCollisions({
      currentLiquidBalance: 20000, // starting balance lower than 45k + 18.5k
      expectedSalary: {
        amount: 180000,
        expectedDate: '2026-11-07', // salary arrives after Nov 3 debits!
        source: 'Infosys CTC Payroll',
      },
      mandates: dummyMandates,
      cushionThreshold: 25000,
    });

    assert.strictEqual(collisions.length >= 1, true);
    const col = collisions[0];
    assert.strictEqual(col.severity, 'CRITICAL_SHORTFALL');
    assert.ok(col.projectedShortfall > 40000);
    assert.strictEqual(col.mitigationStrategies.length >= 1, true);
  });

  // 3. Payment Preflight
  test('Payment Preflight parses valid UPI QR and flags benign merchant as CLEAN', () => {
    const validUpiQr = 'upi://pay?pa=swiggy@icici&pn=Swiggy%20Order&am=499&cu=INR&mc=5812';
    const parsed = parseUPIString(validUpiQr);
    assert.strictEqual(parsed?.vpa, 'swiggy@icici');
    assert.strictEqual(parsed?.amount, 499);

    const analysis = evaluatePaymentPreflight({
      rawInput: validUpiQr,
      expectedMerchant: 'Swiggy',
    });

    assert.strictEqual(analysis.verdict, 'CLEAN');
    assert.ok(analysis.riskScore < 20);
  });

  test('Payment Preflight blocks coercive urgency text and suspicious VPA', () => {
    const scamInput = 'Electricity will be disconnected tonight. Pay urgent fine: upi://pay?pa=sbi-kyc-refund@paytm&pn=Electricity%20Desk&am=14999&cu=INR';
    const analysis = evaluatePaymentPreflight({
      rawInput: scamInput,
    });

    assert.strictEqual(analysis.verdict, 'DANGEROUS');
    assert.ok(analysis.riskScore >= 70);
    assert.ok(analysis.flags.some(f => f.category === 'URGENCY_INJECTION'));
    assert.ok(analysis.flags.some(f => f.category === 'SUSPICIOUS_VPA'));
  });

  // 4. Bill Truth & Contract Drift
  test('Bill Truth Engine catches price hike exceeding registered mandate', () => {
    const mandates: UpiMandate[] = [
      {
        id: 'man-sub-1',
        merchantName: 'Canva Pro',
        category: 'ENTERTAINMENT',
        amount: 499,
        amountRule: 'EXACT',
        frequency: 'MONTHLY',
        startDate: '2025-01-01',
        endDate: '2027-01-01',
        nextDebitDate: '2026-11-10',
        status: 'ACTIVE',
        umn: 'UMNCANVA499@icici',
        preDebitNotificationDays: 2,
        rbiCompliant: true,
      },
    ];

    const transactions: Transaction[] = [
      {
        id: 'tx-canva-drift',
        amount: 699, // Hiked by 200 without consent
        merchantName: 'Canva Pro',
        category: 'ENTERTAINMENT',
        date: '2026-10-25',
        paymentMethod: 'UPI',
        status: 'CLEAN',
      },
    ];

    const drifts = auditBillTruthAndDrift({ mandates, transactions });
    assert.strictEqual(drifts.length, 1);
    assert.strictEqual(drifts[0].detectedDriftType, 'STEALTH_HIKE');
    assert.strictEqual(drifts[0].varianceAmount, 200);

    const dispute = generateDisputePacket(drifts[0]);
    assert.strictEqual(dispute.amountDisputed, 200);
    assert.ok(dispute.complaintLetterDraft.includes('RBI/2020-21/74'));
    assert.ok(dispute.complaintLetterDraft.includes('UMNCANVA499@icici'));
  });

  // 5. Personal Financial Digital Twin
  test('Digital Twin simulates salary delay and calculates deficit day without ledger mutation', () => {
    const baseState = {
      startingBalance: 30000,
      monthlySalary: 150000,
      salaryDay: 1,
      monthlyRent: 35000,
      rentDay: 4,
      fixedMandatesTotal: 15000,
      investmentsTotal: 25000,
      totalEquityPortfolio: 1200000,
      lasBorrowedAmount: 0,
    };

    // Scenario: salary delayed by 10 days
    const result = simulateDigitalTwin(baseState, {
      id: 'scen-delay',
      name: 'Salary Lag Stress Test',
      description: 'Payroll delayed by 10 days',
      salaryDelayDays: 10,
      rentHikePercent: 0,
      equityMarketShockPercent: 0,
      lumpSumExpenseAmount: 0,
      prepayDebtAmount: 0,
    });

    assert.strictEqual(result.projections.length, 30);
    // On day 4, rent debits (35k) from starting 30k -> deficit!
    assert.ok(result.firstDeficitDay !== undefined);
    assert.ok(result.stressedMinBalance < 0);
    assert.ok(result.requiredEmergencyBuffer >= Math.abs(result.stressedMinBalance));
  });

  // 6. Safe Action Protocol
  test('Safe Action Protocol requires biometric confirmation for consequential actions and outputs receipt', () => {
    const plan = prepareActionPlan({
      title: 'Revoke Malicious AutoPay Mandate',
      description: 'Cancel UMN token with NPCI clearinghouse to prevent future recurring debits',
      impactLevel: 'CONSEQUENTIAL_EXTERNAL',
      targetEntity: 'UMN1234567890@icici',
      parameters: { mandateId: 'man-1', action: 'REVOKE' },
      previewChanges: [
        { field: 'Status', currentValue: 'ACTIVE', newValue: 'REVOKED' },
        { field: 'Clearinghouse State', currentValue: 'AUTHORIZED', newValue: 'CANCELLED_AT_BANK' },
      ],
      rollbackPlan: 'Irreversible at NPCI. Customer must initiate fresh mandate creation.',
    });

    assert.strictEqual(plan.requiresPasskey, true);
    assert.ok(plan.sha256Fingerprint.startsWith('ms-sig-'));

    // Attempting execution without passkey should throw
    assert.throws(() => {
      executeActionPlan(plan, '');
    }, /Biometric \/ Passkey cryptographic authorization required/);

    // Execution with simulated passkey succeeds
    const receipt = executeActionPlan(plan, 'WEBAUTHN_PASSKEY_PROOF_VALIDATED_A4B8');
    assert.strictEqual(receipt.executionStatus, 'SUCCESS');
    assert.ok(receipt.receiptId.startsWith('rcpt-'));
    assert.strictEqual(receipt.actionPlanId, plan.id);
  });

});
