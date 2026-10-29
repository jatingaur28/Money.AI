import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLasDrawingPower,
  evaluateLasMarginHealth,
  generateAITaxSavingSuggestions,
} from './portfolioAndTax';
import { InvestmentAsset } from '../types';

test('Loan Against Securities (LAS): Fixed Deposit yields 85% LTV with lower interest rate spread', () => {
  const result = calculateLasDrawingPower('FIXED_DEPOSIT', 500000);
  assert.equal(result.ltvPercent, 85);
  assert.equal(result.drawingPower, 425000);
  assert.ok(result.annualInterestRate <= 8.5);
});

test('Loan Against Securities (LAS): Equity shares capped at 50% LTV per RBI regulations', () => {
  const result = calculateLasDrawingPower('STOCKS', 1000000);
  assert.equal(result.ltvPercent, 50);
  assert.equal(result.drawingPower, 500000);
  assert.equal(result.annualInterestRate, 10.25);
});

test('LAS Margin Health: Low utilization maintains FORTIFIED status with ample buffer', () => {
  const health = evaluateLasMarginHealth(1000000, 300000, 50);
  assert.equal(health.marginHealth, 'FORTIFIED');
  assert.equal(health.currentLtv, 30);
  assert.ok(health.bufferToMarginCallPercent > 20);
});

test('LAS Margin Health: Excessive borrowing triggers WARNING or MARGIN_CALL', () => {
  const health = evaluateLasMarginHealth(1000000, 680000, 50);
  assert.equal(health.marginHealth, 'MARGIN_CALL');
  assert.equal(health.currentLtv, 68);
});

test('AI Tax Suggestions: Unutilized 80C triggers high-priority ELSS tax saving recommendation', () => {
  const sampleAssets: InvestmentAsset[] = [];
  const suggestions = generateAITaxSavingSuggestions({
    grossAnnualIncome: 2400000,
    assets: sampleAssets,
    declared80C: 50000, // 1 Lakh headroom left
    declared80D: 25000,
    declaredNps: 0,
    taxSlabRate: 0.312,
  });

  const sug80c = suggestions.find((s) => s.section === '80C');
  assert.ok(sug80c);
  assert.equal(sug80c.unutilizedHeadroom, 100000);
  assert.equal(sug80c.estimatedTaxSavings, 31200);
  assert.equal(sug80c.urgency, 'HIGH_PRIORITY');
});

test('AI Tax Suggestions: Tax-Loss Harvesting identifies negative PnL assets to offset capital gains', () => {
  const sampleAssets: InvestmentAsset[] = [
    {
      id: 'ast-loss',
      name: 'Tech Midcap ETF',
      type: 'STOCKS',
      currentValue: 80000,
      investedValue: 100000,
      unrealizedPnl: -20000,
      returnsPercentage: -20,
      liquidityTier: 'INSTANT',
    },
  ];

  const suggestions = generateAITaxSavingSuggestions({
    grossAnnualIncome: 2400000,
    assets: sampleAssets,
    declared80C: 150000,
    declared80D: 75000,
    declaredNps: 50000,
  });

  const harvestSug = suggestions.find((s) => s.section === 'TAX_LOSS_HARVESTING');
  assert.ok(harvestSug);
  assert.equal(harvestSug.unutilizedHeadroom, 20000);
  assert.ok(harvestSug.estimatedTaxSavings > 0);
});
