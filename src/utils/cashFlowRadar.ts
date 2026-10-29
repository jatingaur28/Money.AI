/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CashFlowCollision, Obligation } from '../types/intelligence';
import { UpiMandate } from '../types';

export interface CashFlowRadarInput {
  currentLiquidBalance: number;
  expectedSalary: {
    amount: number;
    expectedDate: string; // YYYY-MM-DD
    source: string;
  };
  additionalInflows?: {
    source: string;
    amount: number;
    expectedDate: string;
    reliabilityScore: number;
  }[];
  mandates: UpiMandate[];
  customObligations?: Obligation[];
  cushionThreshold?: number; // default ₹25,000
}

/**
 * Derives comprehensive forward obligations combining mandates, recurring EMIs, and bills.
 */
export function deriveForwardObligations(mandates: UpiMandate[], customObligations: Obligation[] = []): Obligation[] {
  const list: Obligation[] = [...customObligations];

  // Convert active mandates into typed obligations
  mandates.forEach(m => {
    if (m.status === 'ACTIVE' || m.status === 'PAUSED') {
      let consequence: Obligation['consequenceOfDelay'] = 'SERVICE_CUT';
      if (m.merchantName.toLowerCase().includes('loan') || m.merchantName.toLowerCase().includes('emi')) {
        consequence = 'CREDIT_SCORE_HIT';
      } else if (m.category === 'INVESTMENT') {
        consequence = 'CIVIL_PENALTY';
      }

      list.push({
        id: `obl-mandate-${m.id}`,
        title: `${m.merchantName} AutoPay`,
        payee: m.merchantName,
        amount: m.amount,
        dueDate: m.nextDebitDate,
        frequency: m.frequency as any,
        category: m.category === 'INVESTMENT' ? 'SIP' : 'MANDATE',
        isMandateLinked: true,
        umn: m.umn,
        isVariableAmount: m.amountRule === 'MAX',
        provenance: 'VERIFIED_FACT',
        consequenceOfDelay: consequence,
      });
    }
  });

  // Sort ascending by due date
  return list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

/**
 * Evaluates cash-flow collision clusters over a 30-day projection horizon.
 */
export function detectCashFlowCollisions(input: CashFlowRadarInput): CashFlowCollision[] {
  const cushion = input.cushionThreshold ?? 25000;
  const obligations = deriveForwardObligations(input.mandates, input.customObligations);

  // Group obligations by 5-day rolling windows or specific high-impact dates
  const collisions: CashFlowCollision[] = [];
  let runningBalance = input.currentLiquidBalance;

  // Track all inflows
  const inflows = [
    {
      source: input.expectedSalary.source,
      amount: input.expectedSalary.amount,
      expectedDate: input.expectedSalary.expectedDate,
      reliabilityScore: 0.98,
    },
    ...(input.additionalInflows || []),
  ];

  // Map dates of interest
  const dateSet = new Set<string>();
  obligations.forEach(o => dateSet.add(o.dueDate));
  inflows.forEach(i => dateSet.add(i.expectedDate));

  const sortedDates = Array.from(dateSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  sortedDates.forEach(date => {
    // 1. Credit inflows on or before this date
    const inflowsOnDate = inflows.filter(i => i.expectedDate === date);
    inflowsOnDate.forEach(inf => {
      runningBalance += inf.amount;
    });

    // 2. Debits on this date
    const debitsOnDate = obligations.filter(o => o.dueDate === date);
    if (debitsOnDate.length === 0) return;

    const totalDebits = debitsOnDate.reduce((sum, d) => sum + d.amount, 0);
    const balanceBeforeDebits = runningBalance;
    const balanceAfterDebits = balanceBeforeDebits - totalDebits;

    runningBalance = balanceAfterDebits;

    // Check collision condition
    let severity: CashFlowCollision['severity'] = 'HEALTHY';
    let projectedShortfall = 0;

    if (balanceAfterDebits < 0) {
      severity = 'CRITICAL_SHORTFALL';
      projectedShortfall = Math.abs(balanceAfterDebits);
    } else if (balanceAfterDebits < cushion) {
      severity = 'TIGHT_BUFFER';
      projectedShortfall = cushion - balanceAfterDebits;
    } else if (balanceAfterDebits < cushion * 2) {
      severity = 'BALANCED';
    }

    if (severity === 'CRITICAL_SHORTFALL' || severity === 'TIGHT_BUFFER') {
      const mitigations: CashFlowCollision['mitigationStrategies'] = [];

      // Mitigation A: Pause non-essential mandates due on this date
      const discretionary = debitsOnDate.filter(
        d => d.consequenceOfDelay === 'SERVICE_CUT' && d.isMandateLinked
      );
      if (discretionary.length > 0) {
        const potentialSavings = discretionary.reduce((s, d) => s + d.amount, 0);
        mitigations.push({
          id: `mit-pause-${date}`,
          title: `Pause ${discretionary.length} Non-Essential AutoPay Mandates`,
          description: `Temporarily pause subscriptions (${discretionary.map(d => d.payee).join(', ')}) without impacting CIBIL score.`,
          type: 'PAUSE_MANDATE',
          impactAmount: potentialSavings,
        });
      }

      // Mitigation B: Draw against Securities (LAS)
      mitigations.push({
        id: `mit-las-${date}`,
        title: 'Draw Low-Cost LAS Credit Line (8.5% p.a.)',
        description: 'Draw instant liquidity from pledged mutual funds or FDs to bridge timing gap until salary credit.',
        type: 'LAS_CREDIT_LINE',
        impactAmount: Math.max(projectedShortfall + 10000, 50000),
      });

      // Mitigation C: Re-schedule SIP date
      const sipDebits = debitsOnDate.filter(d => d.category === 'SIP');
      if (sipDebits.length > 0) {
        mitigations.push({
          id: `mit-sip-${date}`,
          title: 'Shift Mutual Fund SIP debit date to Salary + 3 days',
          description: 'Modify AMC SIP execution cycle to avoid bouncing fees (NACH ECS penalty: ₹350 - ₹500).',
          type: 'ADJUST_SIP_DATE',
          impactAmount: sipDebits.reduce((s, d) => s + d.amount, 0),
        });
      }

      collisions.push({
        id: `col-${date}`,
        date,
        windowDays: 3,
        projectedBalanceBefore: balanceBeforeDebits,
        totalObligationsDue: totalDebits,
        projectedShortfall,
        severity,
        competingObligations: debitsOnDate,
        expectedInflows: inflowsOnDate,
        mitigationStrategies: mitigations,
      });
    }
  });

  return collisions;
}
