import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateAdvancedTaxPlan } from './taxPlanner';
import { InvestmentAsset } from '../types';

describe('Advanced AI Tax Planner Tests', () => {
  it('Calculates Section 44ADA 50% deemed profit for freelance revenue', () => {
    const plan = generateAdvancedTaxPlan({
      salaryIncome: 1200000,
      freelanceGrossRevenue: 600000, // 50% = 300,000 deemed profit
      tdsAlreadyDeducted: 100000,
    });

    assert.strictEqual(plan.incomeFreelance44ADA, 300000);
    assert.strictEqual(plan.grossTotalIncome, 1500000);
  });

  it('Identifies optimal regime between Old and New based on high deductions', () => {
    // With high 80C, 80CCD, 80D, and Home loan interest (24b) of 2 Lakhs, Old Regime can win
    const plan = generateAdvancedTaxPlan({
      salaryIncome: 2500000,
      claimed80C: 150000,
      claimed80CCD1B: 50000,
      claimed80D: 75000,
      claimed24b: 200000,
      hasSeniorParents: true,
      tdsAlreadyDeducted: 350000,
    });

    assert.ok(plan.oldRegimeTotalTax > 0);
    assert.ok(plan.newRegimeTotalTax > 0);
    assert.ok(plan.optimalRegime === 'OLD_REGIME' || plan.optimalRegime === 'NEW_REGIME');
    assert.ok(plan.netTaxSaved >= 0);
  });

  it('Correctly identifies tax-loss harvesting candidates from negative PnL holdings', () => {
    const assetsWithLoss: InvestmentAsset[] = [
      {
        id: 'tata-loss',
        name: 'Tata Motors',
        symbol: 'TATAMOTORS',
        type: 'STOCKS',
        subCategory: 'Automotive',
        currentValue: 185000,
        investedValue: 200000,
        unrealizedPnl: -15000,
        returnsPercentage: -7.5,
        liquidityTier: 'T+1_DAYS',
      },
      {
        id: 'reliance-gain',
        name: 'Reliance Industries',
        symbol: 'RELIANCE',
        type: 'STOCKS',
        subCategory: 'Conglomerate',
        currentValue: 485000,
        investedValue: 390000,
        unrealizedPnl: 95000,
        returnsPercentage: 24.36,
        liquidityTier: 'T+1_DAYS',
      },
    ];

    const plan = generateAdvancedTaxPlan({
      salaryIncome: 1800000,
      assets: assetsWithLoss,
    });

    assert.strictEqual(plan.taxLossHarvesting.length, 1);
    assert.strictEqual(plan.taxLossHarvesting[0].assetName, 'Tata Motors');
    assert.strictEqual(plan.taxLossHarvesting[0].unrealizedLoss, 15000);
    assert.strictEqual(plan.taxLossHarvesting[0].potentialTaxOffset, 3000); // 20% of 15,000
    assert.strictEqual(plan.totalHarvestableLoss, 15000);
  });

  it('Generates 4 Advance Tax Quarters compliant with statutory percentages', () => {
    const plan = generateAdvancedTaxPlan({
      salaryIncome: 3000000,
      tdsAlreadyDeducted: 200000,
    });

    assert.strictEqual(plan.advanceTaxSchedule.length, 4);
    assert.strictEqual(plan.advanceTaxSchedule[0].statutoryCumulativePercent, 15);
    assert.strictEqual(plan.advanceTaxSchedule[1].statutoryCumulativePercent, 45);
    assert.strictEqual(plan.advanceTaxSchedule[2].statutoryCumulativePercent, 75);
    assert.strictEqual(plan.advanceTaxSchedule[3].statutoryCumulativePercent, 100);
  });
});
