/**
 * MoneyShield OS — Deterministic Financial Math & Indian Tax Logic
 * Conforms to Finance Act 2024 / FY 2024-25 & FY 2025-26 tax provisions.
 */

export interface TaxComparisonInput {
  grossSalary: number;
  section80C: number; // Max 1,50,000 in Old Regime
  section80D: number; // Health Insurance (e.g. 25,000 / 50,000 for parents)
  hraExemption: number;
  npsTier1_80CCD1B?: number; // Up to 50,000 in Old Regime
  homeLoanInterest_Sec24?: number; // Up to 2,00,000
}

export interface TaxComparisonResult {
  grossSalary: number;
  oldRegime: {
    taxableIncome: number;
    baseTax: number;
    cess: number;
    totalTax: number;
    effectiveRate: number;
  };
  newRegime: {
    taxableIncome: number;
    baseTax: number;
    cess: number;
    totalTax: number;
    effectiveRate: number;
  };
  recommendedRegime: 'NEW' | 'OLD';
  annualSavings: number;
}

/**
 * Calculates Old vs New Income Tax in India for individuals
 */
export function calculateIndianTaxRegime(input: TaxComparisonInput): TaxComparisonResult {
  const { grossSalary } = input;

  // 1. OLD REGIME
  // Standard Deduction: ₹50,000
  const oldStdDeduction = 50000;
  const capped80C = Math.min(150000, Math.max(0, input.section80C || 0));
  const capped80D = Math.min(75000, Math.max(0, input.section80D || 0));
  const nps = Math.min(50000, Math.max(0, input.npsTier1_80CCD1B || 0));
  const homeLoan = Math.min(200000, Math.max(0, input.homeLoanInterest_Sec24 || 0));
  const hra = Math.max(0, input.hraExemption || 0);

  const totalOldDeductions = oldStdDeduction + capped80C + capped80D + nps + homeLoan + hra;
  const oldTaxableIncome = Math.max(0, grossSalary - totalOldDeductions);

  let oldBaseTax = 0;
  // Slabs: Up to 2.5L: Nil, 2.5L-5L: 5%, 5L-10L: 20%, Above 10L: 30%
  if (oldTaxableIncome <= 500000) {
    // Section 87A rebate makes tax 0 if taxable income <= 5,00,000
    oldBaseTax = 0;
  } else {
    if (oldTaxableIncome > 250000) {
      oldBaseTax += Math.min(250000, oldTaxableIncome - 250000) * 0.05;
    }
    if (oldTaxableIncome > 500000) {
      oldBaseTax += Math.min(500000, oldTaxableIncome - 500000) * 0.20;
    }
    if (oldTaxableIncome > 1000000) {
      oldBaseTax += (oldTaxableIncome - 1000000) * 0.30;
    }
  }
  const oldCess = Math.round(oldBaseTax * 0.04);
  const oldTotalTax = oldBaseTax + oldCess;

  // 2. NEW REGIME (FY 2024-25 / FY 2025-26 Budget)
  // Standard Deduction: ₹75,000
  const newStdDeduction = 75000;
  const newTaxableIncome = Math.max(0, grossSalary - newStdDeduction);

  let newBaseTax = 0;
  // If taxable income <= 7,00,000, Section 87A rebate gives 100% relief (Tax = 0)
  if (newTaxableIncome <= 700000) {
    newBaseTax = 0;
  } else {
    // Slabs:
    // 0 - 3L: 0%
    // 3L - 7L: 5% (4,00,000 * 0.05 = 20,000)
    // 7L - 10L: 10% (3,00,000 * 0.10 = 30,000)
    // 10L - 12L: 15% (2,00,000 * 0.15 = 30,000)
    // 12L - 15L: 20% (3,00,000 * 0.20 = 60,000)
    // > 15L: 30%
    if (newTaxableIncome > 300000) {
      newBaseTax += Math.min(400000, newTaxableIncome - 300000) * 0.05;
    }
    if (newTaxableIncome > 700000) {
      newBaseTax += Math.min(300000, newTaxableIncome - 700000) * 0.10;
    }
    if (newTaxableIncome > 1000000) {
      newBaseTax += Math.min(200000, newTaxableIncome - 1000000) * 0.15;
    }
    if (newTaxableIncome > 1200000) {
      newBaseTax += Math.min(300000, newTaxableIncome - 1200000) * 0.20;
    }
    if (newTaxableIncome > 1500000) {
      newBaseTax += (newTaxableIncome - 1500000) * 0.30;
    }
  }
  const newCess = Math.round(newBaseTax * 0.04);
  const newTotalTax = newBaseTax + newCess;

  const annualSavings = Math.abs(oldTotalTax - newTotalTax);
  const recommendedRegime = newTotalTax <= oldTotalTax ? 'NEW' : 'OLD';

  return {
    grossSalary,
    oldRegime: {
      taxableIncome: oldTaxableIncome,
      baseTax: oldBaseTax,
      cess: oldCess,
      totalTax: oldTotalTax,
      effectiveRate: grossSalary > 0 ? Number(((oldTotalTax / grossSalary) * 100).toFixed(2)) : 0,
    },
    newRegime: {
      taxableIncome: newTaxableIncome,
      baseTax: newBaseTax,
      cess: newCess,
      totalTax: newTotalTax,
      effectiveRate: grossSalary > 0 ? Number(((newTotalTax / grossSalary) * 100).toFixed(2)) : 0,
    },
    recommendedRegime,
    annualSavings,
  };
}

/**
 * Proprietary Financial Health Score (0 - 1000)
 * 300 pts Liquidity (emergency buffer)
 * 300 pts Debt-to-Income
 * 250 pts Savings Rate
 * 150 pts Threat/Dark-Pattern Exposure
 */
export function calculateFinancialHealthScore(params: {
  monthlyIncome: number;
  monthlyExpenses: number;
  totalDebt: number;
  liquidSavings: number;
  darkPatternsCount: number;
  activeThreatsCount: number;
}): { score: number; grade: string; breakdown: Record<string, number> } {
  const { monthlyIncome, monthlyExpenses, totalDebt, liquidSavings, darkPatternsCount, activeThreatsCount } = params;

  if (monthlyIncome <= 0) {
    return { score: 350, grade: 'Needs Stabilization', breakdown: { liquidity: 100, debt: 100, savings: 100, security: 50 } };
  }

  // 1. Liquidity Buffer (Ideal: 6 months of expenses)
  const monthlyBurn = monthlyExpenses > 0 ? monthlyExpenses : 1;
  const runwayMonths = liquidSavings / monthlyBurn;
  const liquidityScore = Math.min(300, Math.round((runwayMonths / 6) * 300));

  // 2. Debt to Annual Income (Ideal: < 30%)
  const annualIncome = monthlyIncome * 12;
  const dtiRatio = totalDebt / annualIncome;
  let debtScore = 300;
  if (dtiRatio > 1.0) debtScore = 50;
  else if (dtiRatio > 0.5) debtScore = 150;
  else if (dtiRatio > 0.3) debtScore = 220;
  else debtScore = 300;

  // 3. Savings Rate (Ideal: >= 30% of income saved)
  const savings = Math.max(0, monthlyIncome - monthlyExpenses);
  const savingsRate = savings / monthlyIncome;
  const savingsScore = Math.min(250, Math.round((savingsRate / 0.30) * 250));

  // 4. Security & Threat Exposure (150 pts max, deducted by dark patterns & threats)
  let securityScore = 150;
  securityScore -= darkPatternsCount * 25;
  securityScore -= activeThreatsCount * 40;
  securityScore = Math.max(0, securityScore);

  const total = Math.min(1000, Math.max(0, liquidityScore + debtScore + savingsScore + securityScore));

  let grade = 'Needs Stabilization';
  if (total >= 850) grade = 'Fortress Level';
  else if (total >= 700) grade = 'Resilient';
  else if (total >= 550) grade = 'Moderate';

  return {
    score: total,
    grade,
    breakdown: {
      liquidity: liquidityScore,
      debt: debtScore,
      savings: savingsScore,
      security: securityScore,
    },
  };
}

/**
 * SIP Compound Wealth Simulator with Annual Step-Up
 */
export function calculateSipWealth(
  initialMonthlySip: number,
  expectedAnnualReturnRate: number, // e.g. 12 (%)
  years: number,
  annualStepUpPercent: number = 0 // e.g. 10 (%)
): { totalInvested: number; estimatedMaturityValue: number; wealthGain: number } {
  const months = years * 12;
  const monthlyRate = expectedAnnualReturnRate / 100 / 12;

  let totalInvested = 0;
  let corpus = 0;
  let currentMonthlySip = initialMonthlySip;

  for (let m = 1; m <= months; m++) {
    totalInvested += currentMonthlySip;
    corpus = (corpus + currentMonthlySip) * (1 + monthlyRate);

    // Increase SIP every 12 months if step-up is enabled
    if (m % 12 === 0 && annualStepUpPercent > 0) {
      currentMonthlySip += Math.round(currentMonthlySip * (annualStepUpPercent / 100));
    }
  }

  const roundedMaturity = Math.round(corpus);
  return {
    totalInvested: Math.round(totalInvested),
    estimatedMaturityValue: roundedMaturity,
    wealthGain: Math.max(0, roundedMaturity - Math.round(totalInvested)),
  };
}

/**
 * Mutual Fund Fee Drag Analyzer: Regular vs Direct Plans
 * Demonstrates cumulative fee erosion caused by distributor commissions.
 */
export function calculateMutualFundFeeDrag(
  monthlySip: number,
  years: number,
  nominalReturnPercent: number = 13,
  regularExpenseRatio: number = 1.75, // Commission embedded
  directExpenseRatio: number = 0.35 // Direct plan
): {
  directCorpus: number;
  regularCorpus: number;
  commissionLost: number;
  percentageLost: number;
} {
  const directNetReturn = nominalReturnPercent - directExpenseRatio;
  const regularNetReturn = nominalReturnPercent - regularExpenseRatio;

  const directResult = calculateSipWealth(monthlySip, directNetReturn, years, 0);
  const regularResult = calculateSipWealth(monthlySip, regularNetReturn, years, 0);

  const lost = Math.max(0, directResult.estimatedMaturityValue - regularResult.estimatedMaturityValue);
  const percentageLost = Number(((lost / directResult.estimatedMaturityValue) * 100).toFixed(1));

  return {
    directCorpus: directResult.estimatedMaturityValue,
    regularCorpus: regularResult.estimatedMaturityValue,
    commissionLost: lost,
    percentageLost,
  };
}
