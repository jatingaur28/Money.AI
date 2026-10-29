import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generatePortfolioPlan } from './portfolioDesigner';
import { InvestmentAsset } from '../types';

const MOCK_ASSETS: InvestmentAsset[] = [
  {
    id: 'a1',
    name: 'Reliance Industries',
    symbol: 'RELIANCE',
    type: 'STOCKS',
    subCategory: 'Large Cap',
    currentValue: 1000000,
    investedValue: 800000,
    unrealizedPnl: 200000,
    returnsPercentage: 25,
    liquidityTier: 'T+1_DAYS',
  },
  {
    id: 'a2',
    name: 'HDFC Bank Term Deposit',
    type: 'FIXED_DEPOSIT',
    subCategory: '1 Year Cumulative',
    currentValue: 500000,
    investedValue: 500000,
    unrealizedPnl: 0,
    returnsPercentage: 7.5,
    liquidityTier: 'T+1_DAYS',
  },
  {
    id: 'a3',
    name: 'Sovereign Gold Bond',
    type: 'GOLD',
    subCategory: 'RBI Tranche',
    currentValue: 200000,
    investedValue: 180000,
    unrealizedPnl: 20000,
    returnsPercentage: 11.1,
    liquidityTier: 'T+1_DAYS',
  },
];

describe('Portfolio Designer Tests', () => {
  it('Configures aggressive profile with higher expected return and equity allocation', () => {
    const plan = generatePortfolioPlan({
      riskProfile: 'AGGRESSIVE',
      horizon: 'LONG_TERM',
      goal: 'WEALTH_CREATION',
      monthlySip: 30000,
      assets: MOCK_ASSETS,
    });

    assert.ok(plan.expectedAnnualReturn >= 15.0);
    assert.strictEqual(plan.riskProfile, 'AGGRESSIVE');
    assert.ok(plan.buckets.length >= 6);

    const largeCapBucket = plan.buckets.find((b) => b.category === 'LARGE_CAP_EQUITY');
    assert.ok(largeCapBucket);
    assert.strictEqual(largeCapBucket.targetPercent, 40);
  });

  it('Configures conservative profile with high debt allocation and lower drawdown', () => {
    const plan = generatePortfolioPlan({
      riskProfile: 'CONSERVATIVE',
      horizon: 'SHORT_TERM',
      goal: 'RETIREMENT_CORPUS',
      monthlySip: 20000,
      assets: MOCK_ASSETS,
    });

    assert.ok(plan.maxDrawdownRisk <= 15.0);
    const debtBucket = plan.buckets.find((b) => b.category === 'DEBT_AND_FD');
    assert.ok(debtBucket);
    assert.ok(debtBucket.targetPercent >= 45);
  });

  it('Identifies drift and assigns BUY or TRIM actions', () => {
    const plan = generatePortfolioPlan({
      riskProfile: 'MODERATE',
      horizon: 'MEDIUM_TERM',
      goal: 'WEALTH_CREATION',
      monthlySip: 25000,
      assets: MOCK_ASSETS,
    });

    // In mock data: Total = 17L. Large Cap = 10L (58.8% of portfolio vs target 35%).
    // Should flag TRIM or rebalancing.
    const largeCapBucket = plan.buckets.find((b) => b.category === 'LARGE_CAP_EQUITY');
    assert.ok(largeCapBucket);
    assert.strictEqual(largeCapBucket.rebalanceAction, 'TRIM');
    assert.ok(largeCapBucket.driftPercent > 10);
  });

  it('Calculates macro stress test scenarios without NaN', () => {
    const plan = generatePortfolioPlan({
      riskProfile: 'AGGRESSIVE',
      horizon: 'LONG_TERM',
      goal: 'WEALTH_CREATION',
      monthlySip: 50000,
      assets: MOCK_ASSETS,
    });

    assert.strictEqual(plan.stressScenarios.length, 3);
    plan.stressScenarios.forEach((scen) => {
      assert.ok(!isNaN(scen.portfolioImpactPercent));
      assert.ok(!isNaN(scen.estimatedValueChange));
      assert.ok(scen.recoveryStrategy.length > 10);
    });
  });

  it('Allocates monthly SIP across buckets matching the total monthly amount', () => {
    const targetSip = 45000;
    const plan = generatePortfolioPlan({
      riskProfile: 'MODERATE',
      horizon: 'MEDIUM_TERM',
      goal: 'WEALTH_CREATION',
      monthlySip: targetSip,
      assets: MOCK_ASSETS,
    });

    const allocatedTotal = plan.buckets.reduce((sum, b) => sum + b.suggestedMonthlySipAllocation, 0);
    // Allow minor rounding within +/- 100 Rs
    assert.ok(Math.abs(allocatedTotal - targetSip) <= 100);
  });
});
