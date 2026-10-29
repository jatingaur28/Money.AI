/**
 * MoneyShield OS — Comprehensive Portfolio Math & AI Tax Intelligence Engine
 * Covers Fixed Deposits, Direct Equities, Mutual Funds, Loans Against Securities (LAS),
 * and Indian Income Tax optimization rules (Sections 80C, 80D, 80CCD(1B), 24b, and Tax-Loss Harvesting).
 */

import { InvestmentAsset, LoanAgainstSecurities, AITaxSuggestion, UserProfile } from '../types';

/**
 * Calculates Loan-to-Value (LTV) and Drawing Power for Loan Against Securities (LAS)
 * Per RBI Guidelines on advances against shares/mutual funds:
 * - Equity shares & Equity Mutual funds: Max 50% LTV
 * - Debt Mutual funds & Fixed Deposits: Up to 80% - 90% LTV
 */
export function calculateLasDrawingPower(
  assetType: InvestmentAsset['type'],
  collateralValue: number,
  customLtv?: number
): { ltvPercent: number; drawingPower: number; annualInterestRate: number } {
  let ltvPercent = 50;
  let annualInterestRate = 9.75; // Standard competitive LAS rate

  if (assetType === 'FIXED_DEPOSIT') {
    ltvPercent = customLtv || 85;
    annualInterestRate = 8.5; // Spread of ~1% over FD rate
  } else if (assetType === 'MUTUAL_FUNDS') {
    ltvPercent = customLtv || 50;
    annualInterestRate = 9.75;
  } else if (assetType === 'STOCKS') {
    ltvPercent = customLtv || 50;
    annualInterestRate = 10.25;
  } else if (assetType === 'GOLD') {
    ltvPercent = customLtv || 75;
    annualInterestRate = 9.25;
  }

  const drawingPower = Math.round(collateralValue * (ltvPercent / 100));

  return {
    ltvPercent,
    drawingPower,
    annualInterestRate,
  };
}

/**
 * Computes safety margin health for an active Loan Against Securities
 */
export function evaluateLasMarginHealth(
  collateralCurrentValue: number,
  utilizedLoan: number,
  approvedLtv: number
): {
  marginHealth: LoanAgainstSecurities['marginHealth'];
  currentLtv: number;
  bufferToMarginCallPercent: number;
} {
  if (utilizedLoan <= 0) {
    return {
      marginHealth: 'FORTIFIED',
      currentLtv: 0,
      bufferToMarginCallPercent: 100,
    };
  }

  const currentLtv = Number(((utilizedLoan / collateralCurrentValue) * 100).toFixed(1));
  // Margin call typically triggers when LTV breaches 65% on equity securities
  const marginCallThreshold = approvedLtv * 1.3;
  const buffer = Number((marginCallThreshold - currentLtv).toFixed(1));

  let marginHealth: LoanAgainstSecurities['marginHealth'] = 'FORTIFIED';
  if (currentLtv >= marginCallThreshold) {
    marginHealth = 'MARGIN_CALL';
  } else if (currentLtv >= approvedLtv * 1.15) {
    marginHealth = 'WARNING';
  } else if (currentLtv >= approvedLtv) {
    marginHealth = 'STABLE';
  }

  return {
    marginHealth,
    currentLtv,
    bufferToMarginCallPercent: Math.max(0, buffer),
  };
}

/**
 * AI Tax Saving Intelligence: Generates actionable tax deduction suggestions
 * based on current portfolio assets, declared salary, and tax exemptions.
 */
export function generateAITaxSavingSuggestions(params: {
  grossAnnualIncome: number;
  assets: InvestmentAsset[];
  declared80C: number;
  declared80D: number;
  declaredNps: number;
  taxSlabRate?: number; // e.g. 0.30 (30% + cess = 31.2%)
}): AITaxSuggestion[] {
  const { grossAnnualIncome, assets, declared80C, declared80D, declaredNps, taxSlabRate = 0.312 } = params;
  const suggestions: AITaxSuggestion[] = [];

  // 1. Section 80C Headroom (Cap: ₹1,50,000)
  const cap80C = 150000;
  const utilized80C = Math.min(cap80C, declared80C);
  const unutilized80C = Math.max(0, cap80C - utilized80C);

  if (unutilized80C > 0) {
    const taxSaved = Math.round(unutilized80C * taxSlabRate);
    suggestions.push({
      id: 'tax-sug-80c',
      section: '80C',
      title: 'Optimize Section 80C Headroom with Direct ELSS',
      category: 'Equity Linked Savings Scheme & Tax FDs',
      deductionLimit: cap80C,
      utilizedDeduction: utilized80C,
      unutilizedHeadroom: unutilized80C,
      estimatedTaxSavings: taxSaved,
      urgency: unutilized80C > 30000 ? 'HIGH_PRIORITY' : 'RECOMMENDED',
      actionPrompt: `Deploy ₹${unutilized80C.toLocaleString('en-IN')} into Direct ELSS (3-yr lock-in) to save ₹${taxSaved.toLocaleString('en-IN')} before March 31.`,
      recommendedInstruments: ['Mirae Asset ELSS Tax Saver Direct', 'Parag Parikh Tax Saver Fund', 'SBI 5-Year Tax Saving FD (7.25%)'],
      reasoning: 'ELSS has the lowest lock-in period (3 years) among all Section 80C instruments and historically outperforms PPF by 4-6% CAGR.',
      status: 'RECOMMENDED',
    });
  }

  // 2. Section 80CCD(1B) National Pension System (NPS) - Exclusive ₹50,000 Deduction
  const capNps = 50000;
  const utilizedNps = Math.min(capNps, declaredNps);
  const unutilizedNps = Math.max(0, capNps - utilizedNps);

  if (unutilizedNps > 0) {
    const taxSaved = Math.round(unutilizedNps * taxSlabRate);
    suggestions.push({
      id: 'tax-sug-nps',
      section: '80CCD(1B)',
      title: 'Claim Exclusive ₹50,000 Deduction under Section 80CCD(1B)',
      category: 'National Pension System (NPS Tier-1)',
      deductionLimit: capNps,
      utilizedDeduction: utilizedNps,
      unutilizedHeadroom: unutilizedNps,
      estimatedTaxSavings: taxSaved,
      urgency: 'HIGH_PRIORITY',
      actionPrompt: `Contribute ₹${unutilizedNps.toLocaleString('en-IN')} to NPS Tier-1 to unlock an exclusive ₹${taxSaved.toLocaleString('en-IN')} additional tax shield above 80C.`,
      recommendedInstruments: ['HDFC Pension Management Tier 1', 'ICICI Prudential Pension Scheme E (75% Equity)'],
      reasoning: 'This deduction is completely separate from and in addition to the ₹1.5 Lakh Section 80C limit. Highly beneficial for 30% slab earners.',
      status: 'RECOMMENDED',
    });
  }

  // 3. Section 80D Health Insurance Headroom (Cap: ₹25k Self + ₹50k Parents)
  const cap80D = 75000;
  const utilized80D = Math.min(cap80D, declared80D);
  const unutilized80D = Math.max(0, cap80D - utilized80D);

  if (unutilized80D > 10000) {
    const taxSaved = Math.round(unutilized80D * taxSlabRate);
    suggestions.push({
      id: 'tax-sug-80d',
      section: '80D',
      title: 'Health Insurance & Preventive Health Checkup Shield',
      category: 'Medical & Family Healthcare Policy',
      deductionLimit: cap80D,
      utilizedDeduction: utilized80D,
      unutilizedHeadroom: unutilized80D,
      estimatedTaxSavings: taxSaved,
      urgency: 'RECOMMENDED',
      actionPrompt: `Utilize remaining ₹${unutilized80D.toLocaleString('en-IN')} deduction by covering senior citizen parents or claiming ₹5,000 preventive checkups.`,
      recommendedInstruments: ['HDFC Ergo Optima Secure', 'Care Senior Citizen Health Shield'],
      reasoning: 'Section 80D provides ₹25,000 for self/family plus an additional ₹50,000 for parents aged 60+, plus ₹5,000 for preventive blood tests.',
      status: 'RECOMMENDED',
    });
  }

  // 4. Tax Loss Harvesting Intelligence
  // Scan assets for unrealized losses in equities/mutual funds
  const lossMakingAssets = assets.filter((a) => a.unrealizedPnl < 0);
  const totalUnrealizedLoss = lossMakingAssets.reduce((sum, a) => sum + Math.abs(a.unrealizedPnl), 0);

  if (totalUnrealizedLoss > 5000) {
    const potentialLtcgOffset = Math.round(totalUnrealizedLoss * 0.125); // 12.5% LTCG or 20% STCG
    suggestions.push({
      id: 'tax-sug-loss-harvest',
      section: 'TAX_LOSS_HARVESTING',
      title: 'Tax-Loss Harvesting: Offset Realized Capital Gains',
      category: 'Equities & Mutual Funds Portfolio Optimization',
      deductionLimit: totalUnrealizedLoss,
      utilizedDeduction: 0,
      unutilizedHeadroom: totalUnrealizedLoss,
      estimatedTaxSavings: potentialLtcgOffset,
      urgency: 'RECOMMENDED',
      actionPrompt: `Book ₹${totalUnrealizedLoss.toLocaleString('en-IN')} in temporary equity losses before March 31 to offset taxable short-term or long-term gains.`,
      recommendedInstruments: lossMakingAssets.map((a) => a.name),
      reasoning: 'Under Section 70 of the Income Tax Act, short-term capital losses can offset both STCG and LTCG. Rebuy the asset after T+1 to maintain equity allocation.',
      status: 'RECOMMENDED',
    });
  }

  return suggestions;
}
