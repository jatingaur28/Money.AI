/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DigitalTwinDayProjection, DigitalTwinResult, DigitalTwinScenario } from '../types/intelligence';

export interface DigitalTwinBaseState {
  startingBalance: number;
  monthlySalary: number;
  salaryDay: number; // e.g. 1 (1st of month)
  monthlyRent: number;
  rentDay: number; // e.g. 5
  fixedMandatesTotal: number; // e.g. 18500
  investmentsTotal: number; // e.g. 35000
  totalEquityPortfolio: number;
  lasBorrowedAmount: number;
}

/**
 * Runs a pure mathematical what-if simulation without mutating ledger state.
 */
export function simulateDigitalTwin(
  baseState: DigitalTwinBaseState,
  scenario: DigitalTwinScenario
): DigitalTwinResult {
  const daysInMonth = 30;
  const projections: DigitalTwinDayProjection[] = [];

  let baselineBalance = baseState.startingBalance;
  let stressedBalance = baseState.startingBalance - scenario.lumpSumExpenseAmount - scenario.prepayDebtAmount;

  let baselineMin = baselineBalance;
  let stressedMin = stressedBalance;
  let firstDeficitDay: string | undefined = undefined;

  const stressedSalaryDay = baseState.salaryDay + scenario.salaryDelayDays;
  const stressedRent = baseState.monthlyRent * (1 + scenario.rentHikePercent / 100);

  // Evaluate LAS margin health under market shock
  const shockedPortfolioValue = baseState.totalEquityPortfolio * (1 + scenario.equityMarketShockPercent / 100);
  const drawingPowerAfterShock = shockedPortfolioValue * 0.5; // 50% RBI regulatory LTV for equity
  const lasMarginCallTriggered = baseState.lasBorrowedAmount > 0 && baseState.lasBorrowedAmount > drawingPowerAfterShock * 0.85;

  const today = new Date();

  for (let day = 1; day <= daysInMonth; day++) {
    const projDate = new Date(today.getFullYear(), today.getMonth(), day);
    const dateStr = projDate.toISOString().split('T')[0];
    let note: string | undefined = undefined;

    // --- Baseline Day Accounting ---
    if (day === baseState.salaryDay) {
      baselineBalance += baseState.monthlySalary;
    }
    if (day === baseState.rentDay) {
      baselineBalance -= baseState.monthlyRent;
    }
    if (day === 10) {
      baselineBalance -= baseState.fixedMandatesTotal;
    }
    if (day === 15) {
      baselineBalance -= baseState.investmentsTotal;
    }

    // --- Stressed Day Accounting ---
    if (day === stressedSalaryDay) {
      stressedBalance += baseState.monthlySalary;
      note = `Delayed Salary Credited (+₹${baseState.monthlySalary.toLocaleString('en-IN')})`;
    }
    if (day === baseState.rentDay) {
      stressedBalance -= stressedRent;
      if (scenario.rentHikePercent > 0) {
        note = `Hiked Rent Debited (-₹${Math.round(stressedRent).toLocaleString('en-IN')})`;
      }
    }
    if (day === 10) {
      stressedBalance -= baseState.fixedMandatesTotal;
    }
    if (day === 15) {
      stressedBalance -= baseState.investmentsTotal;
    }

    if (baselineBalance < baselineMin) baselineMin = baselineBalance;
    if (stressedBalance < stressedMin) stressedMin = stressedBalance;

    const isDeficit = stressedBalance < 0;
    if (isDeficit && !firstDeficitDay) {
      firstDeficitDay = dateStr;
    }

    projections.push({
      dayIndex: day,
      date: dateStr,
      baselineBalance: Math.round(baselineBalance),
      stressedBalance: Math.round(stressedBalance),
      isDeficit,
      stressFactorNote: note,
    });
  }

  // Generate actionable insights
  const actionableInsights: string[] = [];

  if (firstDeficitDay) {
    actionableInsights.push(
      `Under this scenario, your cash flow enters a deficit on ${firstDeficitDay}. An emergency buffer of ₹${Math.abs(stressedMin).toLocaleString('en-IN')} is required to prevent bounced debits.`
    );
  } else {
    actionableInsights.push(
      `Your balance buffer remains positive throughout the 30-day window (minimum balance ₹${stressedMin.toLocaleString('en-IN')}).`
    );
  }

  if (lasMarginCallTriggered) {
    actionableInsights.push(
      `CRITICAL: A ${Math.abs(scenario.equityMarketShockPercent)}% equity market drawdown breaches your LAS borrowing margin. Maintain ₹${Math.round(baseState.lasBorrowedAmount - drawingPowerAfterShock * 0.85).toLocaleString('en-IN')} in collateral buffer.`
    );
  }

  if (scenario.salaryDelayDays >= 7) {
    actionableInsights.push(
      `A ${scenario.salaryDelayDays}-day salary lag overlaps with rent and mandate cycles. Consider setting auto-sweep on Fixed Deposits to prevent overdraft penalties.`
    );
  }

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    baselineMinBalance: Math.round(baselineMin),
    stressedMinBalance: Math.round(stressedMin),
    firstDeficitDay,
    lasMarginCallTriggered,
    requiredEmergencyBuffer: stressedMin < 0 ? Math.abs(stressedMin) + 25000 : 25000,
    projections,
    actionableInsights,
  };
}
