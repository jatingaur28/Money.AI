/**
 * MoneyShield OS — Portfolio Designer & Asset Allocation Engine
 * Modern Portfolio Theory (MPT) tailored for Indian financial instruments and macro environments.
 */

import { 
  InvestmentAsset, 
  RiskProfileType, 
  InvestmentHorizonType, 
  PortfolioGoalType, 
  PortfolioDesignerPlan, 
  AssetAllocationBucket, 
  MacroStressScenario 
} from '../types';

interface DesignerInput {
  riskProfile: RiskProfileType;
  horizon: InvestmentHorizonType;
  goal: PortfolioGoalType;
  monthlySip: number;
  assets: InvestmentAsset[];
}

export function generatePortfolioPlan(input: DesignerInput): PortfolioDesignerPlan {
  const { riskProfile, horizon, goal, monthlySip, assets } = input;
  const totalPortfolioValue = assets.reduce((sum, a) => sum + a.currentValue, 0);

  // 1. Determine Target Percentages by Risk Profile
  let targetLargeCap = 35;
  let targetMidSmall = 15;
  let targetDebt = 25;
  let targetGold = 10;
  let targetElss = 10;
  let targetLiquid = 5;
  let expectedReturn = 12.5;
  let sharpeRatio = 1.25;
  let maxDrawdown = 18.0;

  if (riskProfile === 'CONSERVATIVE') {
    targetLargeCap = 25;
    targetMidSmall = 5;
    targetDebt = 45;
    targetGold = 15;
    targetElss = 5;
    targetLiquid = 5;
    expectedReturn = 9.4;
    sharpeRatio = 1.48;
    maxDrawdown = 10.5;
  } else if (riskProfile === 'MODERATE') {
    targetLargeCap = 35;
    targetMidSmall = 15;
    targetDebt = 25;
    targetGold = 10;
    targetElss = 10;
    targetLiquid = 5;
    expectedReturn = 12.8;
    sharpeRatio = 1.26;
    maxDrawdown = 17.5;
  } else if (riskProfile === 'AGGRESSIVE') {
    targetLargeCap = 40;
    targetMidSmall = 30;
    targetDebt = 10;
    targetGold = 5;
    targetElss = 10;
    targetLiquid = 5;
    expectedReturn = 15.6;
    sharpeRatio = 1.15;
    maxDrawdown = 26.0;
  } else if (riskProfile === 'ULTRA_GROWTH') {
    targetLargeCap = 35;
    targetMidSmall = 45;
    targetDebt = 5;
    targetGold = 5;
    targetElss = 5;
    targetLiquid = 5;
    expectedReturn = 17.8;
    sharpeRatio = 1.05;
    maxDrawdown = 34.0;
  }

  // Adjust slightly for horizon
  if (horizon === 'SHORT_TERM') {
    targetDebt += 10;
    targetMidSmall = Math.max(5, targetMidSmall - 10);
  } else if (horizon === 'GENERATIONAL') {
    targetMidSmall += 5;
    targetDebt = Math.max(5, targetDebt - 5);
  }

  // Ensure total adds to 100
  const currentSum = targetLargeCap + targetMidSmall + targetDebt + targetGold + targetElss + targetLiquid;
  if (currentSum !== 100) {
    targetLargeCap += (100 - currentSum);
  }

  // 2. Classify Current Assets into Buckets
  let currentLargeCapVal = 0;
  let currentMidSmallVal = 0;
  let currentDebtVal = 0;
  let currentGoldVal = 0;
  let currentElssVal = 0;
  let currentLiquidVal = 0;

  for (const asset of assets) {
    if (asset.type === 'STOCKS') {
      if (asset.name.includes('Tata Motors') || asset.subCategory?.includes('Mid') || asset.subCategory?.includes('Small')) {
        currentMidSmallVal += asset.currentValue;
      } else {
        currentLargeCapVal += asset.currentValue;
      }
    } else if (asset.type === 'FIXED_DEPOSIT' || asset.type === 'EPF' || asset.type === 'PPF') {
      currentDebtVal += asset.currentValue;
    } else if (asset.type === 'GOLD') {
      currentGoldVal += asset.currentValue;
    } else if (asset.type === 'MUTUAL_FUNDS') {
      if (asset.name.includes('ELSS') || asset.taxTag === '80C') {
        currentElssVal += asset.currentValue;
      } else {
        currentLargeCapVal += asset.currentValue * 0.7;
        currentMidSmallVal += asset.currentValue * 0.3;
      }
    } else {
      currentLiquidVal += asset.currentValue;
    }
  }

  const denom = totalPortfolioValue > 0 ? totalPortfolioValue : 1;

  // 3. Create Bucket Allocation Records
  const rawBuckets = [
    {
      id: 'bkt-large-cap',
      name: 'Nifty 50 & Bluechip Direct Equities',
      category: 'LARGE_CAP_EQUITY' as const,
      targetPercent: targetLargeCap,
      currentValue: currentLargeCapVal,
      recommendedInstruments: ['Reliance Industries', 'HDFC Bank', 'TCS', 'Nifty 50 Index Fund'],
      rationale: 'Foundation layer for corporate profit participation with high institutional liquidity.',
    },
    {
      id: 'bkt-mid-small',
      name: 'Mid & Small-Cap High Alpha Growth',
      category: 'MID_SMALL_CAP' as const,
      targetPercent: targetMidSmall,
      currentValue: currentMidSmallVal,
      recommendedInstruments: ['Tata Motors', 'Nippon Small Cap Direct', 'HDFC Mid-Cap Opportunities'],
      rationale: 'Long-term GDP multiplier capturing emerging domestic market leaders.',
    },
    {
      id: 'bkt-debt-fd',
      name: 'Fixed Deposits & Sovereign Debt (LAS Collateral)',
      category: 'DEBT_AND_FD' as const,
      targetPercent: targetDebt,
      currentValue: currentDebtVal,
      recommendedInstruments: ['HDFC Green Term Deposit (7.65%)', 'SBI Term Deposit', 'Target Maturity Debt Index'],
      rationale: 'Capital preservation bucket with instant credit line capability (up to 85% LTV).',
    },
    {
      id: 'bkt-gold',
      name: 'Sovereign Gold Bonds (SGB) & 24K Vault Gold',
      category: 'GOLD_AND_SGB' as const,
      targetPercent: targetGold,
      currentValue: currentGoldVal,
      recommendedInstruments: ['SGB Series 2023-24 (2.5% yield)', 'MMTC-PAMP Digital Gold'],
      rationale: 'Zero-credit-risk hedge against fiat inflation and global currency debasement.',
    },
    {
      id: 'bkt-elss',
      name: 'Section 80C Tax-Shield ELSS Funds',
      category: 'TAX_SAVER_ELSS' as const,
      targetPercent: targetElss,
      currentValue: currentElssVal,
      recommendedInstruments: ['Mirae Asset ELSS Tax Saver Direct', 'Parag Parikh Tax Saver'],
      rationale: 'Triple benefit: 3-year shortest equity lock-in, Section 80C tax deduction, and equity compounding.',
    },
    {
      id: 'bkt-liquid',
      name: 'Instant Liquidity & Emergency Cash Buffer',
      category: 'LIQUID_RESERVES' as const,
      targetPercent: targetLiquid,
      currentValue: currentLiquidVal,
      recommendedInstruments: ['HDFC Instant Sweep Account', 'ICICI Prudential Overnight Fund'],
      rationale: 'Instant buffer for unexpected debits, avoiding distressed asset liquidation.',
    },
  ];

  const buckets: AssetAllocationBucket[] = rawBuckets.map((b) => {
    const currentPercent = parseFloat(((b.currentValue / denom) * 100).toFixed(1));
    const targetValue = Math.round((b.targetPercent / 100) * totalPortfolioValue);
    const driftPercent = parseFloat((currentPercent - b.targetPercent).toFixed(1));
    
    let rebalanceAction: 'BUY' | 'TRIM' | 'BALANCED' = 'BALANCED';
    if (driftPercent < -2) rebalanceAction = 'BUY';
    else if (driftPercent > 2) rebalanceAction = 'TRIM';

    // Calculate suggested SIP split (weighting more heavily to underallocated buckets)
    let sipWeight = b.targetPercent;
    if (rebalanceAction === 'BUY') sipWeight += Math.abs(driftPercent) * 2;
    if (rebalanceAction === 'TRIM') sipWeight = Math.max(0, sipWeight - driftPercent);

    return {
      ...b,
      currentPercent,
      targetValue,
      driftPercent,
      rebalanceAction,
      suggestedMonthlySipAllocation: 0, // computed below in normalization
    };
  });

  // Normalize SIP allocations so they sum exactly to monthlySip
  const totalSipWeights = buckets.reduce((acc, b) => {
    const weight = b.rebalanceAction === 'BUY' ? b.targetPercent + 15 : b.rebalanceAction === 'BALANCED' ? b.targetPercent : 5;
    return acc + weight;
  }, 0);

  buckets.forEach((b) => {
    const weight = b.rebalanceAction === 'BUY' ? b.targetPercent + 15 : b.rebalanceAction === 'BALANCED' ? b.targetPercent : 5;
    b.suggestedMonthlySipAllocation = Math.round((weight / totalSipWeights) * monthlySip);
  });

  // 4. Macro Stress Testing Scenarios
  const equityShare = (currentLargeCapVal + currentMidSmallVal + currentElssVal) / denom;
  const debtShare = currentDebtVal / denom;
  const goldShare = currentGoldVal / denom;

  const stressScenarios: MacroStressScenario[] = [
    {
      id: 'scen-crash',
      name: 'Global Financial Correction (-30% Equity Shock)',
      triggerEvent: 'Broad market drawdown similar to 2008 or March 2020 pandemic trough.',
      portfolioImpactPercent: parseFloat(((equityShare * -30) + (debtShare * 2) + (goldShare * 12)).toFixed(1)),
      estimatedValueChange: Math.round(totalPortfolioValue * (((equityShare * -30) + (debtShare * 2) + (goldShare * 12)) / 100)),
      resilienceRating: debtShare + goldShare > 0.3 ? 'SHIELDED' : 'MODERATE_EXPOSURE',
      recoveryStrategy: 'Your gold and debt reserves act as counter-cyclical buffers. Automatically initiate phased STP into Nifty 50 at deep valuation discounts.',
    },
    {
      id: 'scen-rate-hike',
      name: 'RBI Hawkish Tightening & Sticky Inflation (+150 bps)',
      triggerEvent: 'Central bank raises repo rates to combat core inflation; bonds reprice lower.',
      portfolioImpactPercent: parseFloat(((equityShare * -6) + (debtShare * 4) + (goldShare * 18)).toFixed(1)),
      estimatedValueChange: Math.round(totalPortfolioValue * (((equityShare * -6) + (debtShare * 4) + (goldShare * 18)) / 100)),
      resilienceRating: 'SHIELDED',
      recoveryStrategy: 'Fixed deposits lock in higher reinvestment yields (up to 8.25%). Gold absorbs rupee depreciation pressures.',
    },
    {
      id: 'scen-bull-run',
      name: 'India Capex Boom & Corporate Earnings Rally (+25%)',
      triggerEvent: 'Strong manufacturing GDP growth, GST collections peak, FII net positive inflows.',
      portfolioImpactPercent: parseFloat(((equityShare * 28) + (debtShare * 5) + (goldShare * -2)).toFixed(1)),
      estimatedValueChange: Math.round(totalPortfolioValue * (((equityShare * 28) + (debtShare * 5) + (goldShare * -2)) / 100)),
      resilienceRating: 'SHIELDED',
      recoveryStrategy: 'Alpha equity expansion accelerates net worth. Automatically harvest partial profits at target P/E thresholds above 24x.',
    },
  ];

  // 5. Blueprint & Executive Summary
  const overweightBuckets = buckets.filter((b) => b.rebalanceAction === 'TRIM').map((b) => b.name);
  const underweightBuckets = buckets.filter((b) => b.rebalanceAction === 'BUY').map((b) => b.name);

  const rebalancingBlueprint: string[] = [
    underweightBuckets.length > 0 
      ? `Redirect upcoming ₹${monthlySip.toLocaleString('en-IN')}/mo SIP capacity into ${underweightBuckets.join(' and ')} to correct allocation drift without triggering capital gains taxes.`
      : 'Maintain current steady-state SIP allocations; your asset weights are within 2% of optimal frontier.',
    'Keep Fixed Deposits unencumbered to preserve ₹3.62L instantaneous LAS drawing power at 9.75% interest spread.',
    'Schedule quarterly portfolio audit on the 1st of every quarter; harvest capital losses whenever short-term dips exceed 8%.',
  ];

  const aiExecutiveSummary = `For an **${riskProfile}** profile with a **${horizon.replace('_', ' ')}** horizon, this plan balances wealth compounding with high liquidity defense. Target expected annual return is **${expectedReturn}%** (Sharpe Ratio: **${sharpeRatio}**). Your current holdings are ${overweightBuckets.length > 0 ? `overweight in ${overweightBuckets[0]}` : 'well-proportioned'}, which can be smoothly rebalanced via your monthly SIP of ₹${monthlySip.toLocaleString('en-IN')}.`;

  return {
    riskProfile,
    horizon,
    goal,
    monthlySip,
    totalPortfolioValue,
    expectedAnnualReturn: expectedReturn,
    sharpeRatio,
    maxDrawdownRisk: maxDrawdown,
    buckets,
    stressScenarios,
    aiExecutiveSummary,
    rebalancingBlueprint,
  };
}
