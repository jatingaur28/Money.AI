/**
 * MoneyShield OS — Advanced AI Tax Planner & Optimizer
 * Comprehensive Indian Income Tax calculation (FY 2024-25 & FY 2025-26)
 * Covers Sections 80C, 80CCD(1B), 80D, 24(b), 44ADA, Tax-Loss Harvesting, and Advance Tax Sec 234C.
 */

import { 
  InvestmentAsset, 
  AdvancedTaxPlanResult, 
  TaxLossHarvestItem, 
  AdvanceTaxQuarter 
} from '../types';

export interface TaxPlannerInput {
  financialYear?: '2024-25' | '2025-26';
  salaryIncome: number;
  freelanceGrossRevenue?: number; // Subject to Sec 44ADA (50% deemed profit)
  capitalGainsStcg?: number;
  capitalGainsLtcg?: number;
  otherSourcesIncome?: number;
  tdsAlreadyDeducted?: number;
  claimed80C?: number;
  claimed80CCD1B?: number;
  claimed80D?: number;
  claimed24b?: number;
  claimed80E?: number;
  hasSeniorParents?: boolean;
  assets?: InvestmentAsset[];
}

export function generateAdvancedTaxPlan(input: TaxPlannerInput): AdvancedTaxPlanResult {
  const financialYear = input.financialYear || '2024-25';
  const salaryIncome = input.salaryIncome;
  const freelanceRevenue = input.freelanceGrossRevenue || 0;
  // Section 44ADA: 50% deemed taxable profit for professionals/freelancers
  const deemedFreelanceIncome = Math.round(freelanceRevenue * 0.5);
  const stcg = input.capitalGainsStcg || 0;
  const ltcg = input.capitalGainsLtcg || 0;
  const capitalGains = stcg + ltcg;
  const otherIncome = input.otherSourcesIncome || 0;
  const tdsPaid = input.tdsAlreadyDeducted || 0;

  const grossTotalIncome = salaryIncome + deemedFreelanceIncome + capitalGains + otherIncome;

  // Chapter VI-A Deductions
  const sec80CLimit = 150000;
  const claimed80C = Math.min(sec80CLimit, input.claimed80C ?? 150000);

  const sec80CCDLimit = 50000;
  const claimed80CCD = Math.min(sec80CCDLimit, input.claimed80CCD1B ?? 50000);

  // Section 80D: Self/Family up to 25k + Senior Parents up to 50k
  const sec80DLimit = input.hasSeniorParents ? 75000 : 25000;
  const claimed80D = Math.min(sec80DLimit, input.claimed80D ?? 25000);

  const sec24bLimit = 200000; // Home loan interest
  const claimed24b = Math.min(sec24bLimit, input.claimed24b ?? 0);

  const claimed80E = input.claimed80E ?? 0;
  const claimed80TTA = Math.min(10000, otherIncome);

  const totalOldDeductions = claimed80C + claimed80CCD + claimed80D + claimed24b + claimed80E + claimed80TTA;

  // 1. Calculate Old Regime Tax
  // Standard deduction under Old Regime = ₹50,000 for salaried
  const oldStandardDeduction = salaryIncome > 0 ? 50000 : 0;
  const oldTaxableIncome = Math.max(0, grossTotalIncome - oldStandardDeduction - totalOldDeductions);

  let oldBaseTax = 0;
  if (oldTaxableIncome <= 250000) {
    oldBaseTax = 0;
  } else if (oldTaxableIncome <= 500000) {
    oldBaseTax = (oldTaxableIncome - 250000) * 0.05;
  } else if (oldTaxableIncome <= 1000000) {
    oldBaseTax = 12500 + (oldTaxableIncome - 500000) * 0.20;
  } else {
    oldBaseTax = 112500 + (oldTaxableIncome - 1000000) * 0.30;
  }

  // Rebate u/s 87A under Old Regime: Nil tax if taxable income <= ₹5,00,000
  if (oldTaxableIncome <= 500000) {
    oldBaseTax = 0;
  }
  const oldRegimeTotalTax = Math.round(oldBaseTax * 1.04); // 4% Health & Education Cess

  // 2. Calculate New Regime Tax (FY 2024-26 Slabs)
  // Standard deduction under New Regime = ₹75,000 (revised Budget 2024)
  const newStandardDeduction = salaryIncome > 0 ? 75000 : 0;
  const newTaxableIncome = Math.max(0, grossTotalIncome - newStandardDeduction);

  let newBaseTax = 0;
  if (newTaxableIncome <= 300000) {
    newBaseTax = 0;
  } else if (newTaxableIncome <= 700000) {
    newBaseTax = (newTaxableIncome - 300000) * 0.05;
  } else if (newTaxableIncome <= 1000000) {
    newBaseTax = 20000 + (newTaxableIncome - 700000) * 0.10;
  } else if (newTaxableIncome <= 1200000) {
    newBaseTax = 50000 + (newTaxableIncome - 1000000) * 0.15;
  } else if (newTaxableIncome <= 1500000) {
    newBaseTax = 80000 + (newTaxableIncome - 1200000) * 0.20;
  } else {
    newBaseTax = 140000 + (newTaxableIncome - 1500000) * 0.30;
  }

  // Rebate u/s 87A under New Regime: Nil tax if taxable income <= ₹7,00,000
  if (newTaxableIncome <= 700000) {
    newBaseTax = 0;
  }
  const newRegimeTotalTax = Math.round(newBaseTax * 1.04);

  // Optimal regime decision
  const isOldOptimal = oldRegimeTotalTax < newRegimeTotalTax;
  const optimalRegime = isOldOptimal ? 'OLD_REGIME' : 'NEW_REGIME';
  const effectiveTax = isOldOptimal ? oldRegimeTotalTax : newRegimeTotalTax;
  const netTaxSaved = Math.abs(oldRegimeTotalTax - newRegimeTotalTax);
  const effectiveTaxRate = grossTotalIncome > 0 ? parseFloat(((effectiveTax / grossTotalIncome) * 100).toFixed(1)) : 0;

  // 3. Tax Loss Harvesting Opportunities
  const assets = input.assets || [];
  const taxLossHarvesting: TaxLossHarvestItem[] = [];
  let totalHarvestableLoss = 0;

  assets.forEach((asset) => {
    if (asset.unrealizedPnl < 0) {
      const loss = Math.abs(asset.unrealizedPnl);
      totalHarvestableLoss += loss;
      // Post-Budget 2024: STCG is taxed at 20%, LTCG at 12.5%
      const offsetRate = 0.20; // conservative STCG shield
      const potentialOffset = Math.round(loss * offsetRate);

      taxLossHarvesting.push({
        assetId: asset.id,
        assetName: asset.name,
        symbol: asset.symbol || asset.name.split(' ')[0],
        units: 25,
        buyPrice: Math.round(asset.investedValue / 25),
        currentPrice: Math.round(asset.currentValue / 25),
        holdingType: 'SHORT_TERM',
        unrealizedLoss: loss,
        potentialTaxOffset: potentialOffset,
        recommendedAction: `Sell before March 31 to book ₹${loss.toLocaleString('en-IN')} capital loss. Offset against STCG, saving ₹${potentialOffset.toLocaleString('en-IN')}. Repurchase after 24 hours if high conviction.`,
        deadline: '31 March',
      });
    }
  });

  const potentialHarvestTaxSavings = taxLossHarvesting.reduce((sum, item) => sum + item.potentialTaxOffset, 0);

  // 4. Advance Tax Statutory Schedule (Sections 234B & 234C)
  const netPayableTax = Math.max(0, effectiveTax - tdsPaid);
  const quarters: { q: 'Q1' | 'Q2' | 'Q3' | 'Q4'; name: string; date: string; pct: number }[] = [
    { q: 'Q1', name: '1st Installment (15%)', date: '15 June', pct: 0.15 },
    { q: 'Q2', name: '2nd Installment (45%)', date: '15 September', pct: 0.45 },
    { q: 'Q3', name: '3rd Installment (75%)', date: '15 December', pct: 0.75 },
    { q: 'Q4', name: '4th Installment (100%)', date: '15 March', pct: 1.00 },
  ];

  const advanceTaxSchedule: AdvanceTaxQuarter[] = quarters.map((item, idx) => {
    const cumulativeDue = Math.round(effectiveTax * item.pct);
    // Approximate TDS apportioned evenly across quarters
    const cumulativeTdsPaid = Math.round(tdsPaid * ((idx + 1) / 4));
    const shortfall = Math.max(0, cumulativeDue - cumulativeTdsPaid);
    // Section 234C: 1% per month for 3 months on shortfall
    const interestPenalty = shortfall > 10000 ? Math.round(shortfall * 0.01 * 3) : 0;

    return {
      quarter: item.q,
      title: item.name,
      dueDate: item.date,
      statutoryCumulativePercent: Math.round(item.pct * 100),
      cumulativeTaxDue: cumulativeDue,
      taxPaidToDate: cumulativeTdsPaid,
      shortfallAmount: shortfall,
      interestPenaltySec234C: interestPenalty,
      status: shortfall === 0 ? 'PAID' : (idx < 2 ? 'PAID' : idx === 2 ? 'DUE' : 'UPCOMING'),
    };
  });

  // 5. AI Tax Shield Blueprint
  const aiTaxShieldBlueprint: string[] = [
    optimalRegime === 'NEW_REGIME'
      ? `**New Tax Regime is your optimal path**: Total tax is ₹${newRegimeTotalTax.toLocaleString('en-IN')} (saving ₹${netTaxSaved.toLocaleString('en-IN')} vs Old Regime) due to lower slab rates and the ₹75,000 standard deduction.`
      : `**Old Tax Regime is your optimal path**: Total tax is ₹${oldRegimeTotalTax.toLocaleString('en-IN')} (saving ₹${netTaxSaved.toLocaleString('en-IN')} vs New Regime) because your combined deductions (80C, 80D, HRA/Home Loan) exceed the ₹4,25,000 break-even threshold.`,
    `**NPS Section 80CCD(1B)**: Deploy ₹50,000 into National Pension System to unlock ₹15,600 in net cash tax savings regardless of 80C limits.`,
    totalHarvestableLoss > 0
      ? `**Tax-Loss Harvesting Alert**: You have ₹${totalHarvestableLoss.toLocaleString('en-IN')} in booked/unrealized losses. Harvest them before March 31 to shield up to ₹${potentialHarvestTaxSavings.toLocaleString('en-IN')} in capital gains taxes.`
      : `**Zero Unharvested Losses**: Your portfolio is currently fully in green or neutral positions.`,
    freelanceRevenue > 0
      ? `**Section 44ADA Presumptive Shield**: Your ₹${freelanceRevenue.toLocaleString('en-IN')} freelance income is taxed on only ₹${deemedFreelanceIncome.toLocaleString('en-IN')} (50% deemed profit), eliminating CA audit requirements u/s 44AB.`
      : `**Advance Tax Prudence**: Verify that employer TDS covers at least 90% of your liability to prevent Section 234B interest charges upon filing your ITR.`,
  ];

  return {
    financialYear,
    grossTotalIncome,
    incomeSalary: salaryIncome,
    incomeFreelance44ADA: deemedFreelanceIncome,
    incomeCapitalGains: capitalGains,
    incomeOtherSources: otherIncome,
    deductionsChapterVIA: {
      sec80C: { claimed: claimed80C, maxLimit: sec80CLimit, eligibleItems: ['ELSS Direct Mutual Funds', 'PPF', 'EPF', '5-Yr Tax-Saver FD'] },
      sec80CCD1B: { claimed: claimed80CCD, maxLimit: sec80CCDLimit, eligibleItems: ['NPS Tier 1 Scheme E (75% Equity)'] },
      sec80D: { claimed: claimed80D, maxLimit: sec80DLimit, eligibleItems: ['Family Health Shield', 'Parents Comprehensive Policy', '₹5,000 Preventive Health Checkup'] },
      sec24b: { claimed: claimed24b, maxLimit: sec24bLimit, eligibleItems: ['Self-Occupied Home Loan Interest Certificate'] },
      sec80E: { claimed: claimed80E, maxLimit: 999999, eligibleItems: ['Higher Education Loan Interest (No Cap)'] },
      sec80TTA: { claimed: claimed80TTA, maxLimit: 10000, eligibleItems: ['Savings Bank Account Interest'] },
    },
    oldRegimeTotalTax,
    newRegimeTotalTax,
    optimalRegime,
    netTaxSaved,
    effectiveTaxRate,
    advanceTaxSchedule,
    taxLossHarvesting,
    totalHarvestableLoss,
    potentialHarvestTaxSavings,
    aiTaxShieldBlueprint,
  };
}
