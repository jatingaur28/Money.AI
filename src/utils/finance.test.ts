import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateIndianTaxRegime,
  calculateFinancialHealthScore,
  calculateSipWealth,
  calculateMutualFundFeeDrag,
} from './finance';

test('Tax Calculator: Nil tax under New Regime when taxable income <= 7 Lakhs (Rebate 87A)', () => {
  const result = calculateIndianTaxRegime({
    grossSalary: 750000, // 7.5L minus standard deduction 75k = 6.75L taxable
    section80C: 0,
    section80D: 0,
    hraExemption: 0,
  });

  assert.equal(result.newRegime.taxableIncome, 675000);
  assert.equal(result.newRegime.totalTax, 0);
  assert.equal(result.recommendedRegime, 'NEW');
});

test('Tax Calculator: Old Regime vs New Regime for high income with substantial 80C and HRA deductions', () => {
  const result = calculateIndianTaxRegime({
    grossSalary: 1500000,
    section80C: 150000,
    section80D: 25000,
    hraExemption: 200000,
  });

  assert.ok(result.oldRegime.taxableIncome < 1500000);
  assert.ok(result.newRegime.taxableIncome < 1500000);
  assert.ok(result.annualSavings >= 0);
});

test('Health Score: High savings, zero debt, safe environment yields Fortress Level score', () => {
  const health = calculateFinancialHealthScore({
    monthlyIncome: 200000,
    monthlyExpenses: 60000,
    totalDebt: 0,
    liquidSavings: 600000, // 10 months runway
    darkPatternsCount: 0,
    activeThreatsCount: 0,
  });

  assert.ok(health.score >= 850);
  assert.equal(health.grade, 'Fortress Level');
});

test('SIP Calculator: Calculates positive compounded growth over 10 years', () => {
  const sip = calculateSipWealth(10000, 12, 10, 0);
  // Total invested = 10,000 * 120 = 12,00,000
  assert.equal(sip.totalInvested, 1200000);
  // At 12% annual, ~23.2 Lakhs
  assert.ok(sip.estimatedMaturityValue > 2000000);
  assert.ok(sip.wealthGain > 800000);
});

test('Fee Drag: Direct Mutual Fund preserves substantial wealth compared to Regular Plan with commission', () => {
  const comparison = calculateMutualFundFeeDrag(15000, 15, 13, 1.8, 0.3);
  assert.ok(comparison.directCorpus > comparison.regularCorpus);
  assert.ok(comparison.commissionLost > 1000000); // More than 10 Lakhs saved over 15 years
});
