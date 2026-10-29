/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CashFlowCollision, Obligation } from '../types/intelligence';
import { UpiMandate } from '../types';
import { detectCashFlowCollisions } from '../utils/cashFlowRadar';
import { Radio, AlertOctagon, Calendar, ArrowRight, ShieldCheck, TrendingDown, Clock, ShieldAlert, Sparkles } from 'lucide-react';

interface Props {
  mandates: UpiMandate[];
  liquidBalance: number;
  monthlySalary: number;
  onSelectMitigation: (mitigation: CashFlowCollision['mitigationStrategies'][0], collision: CashFlowCollision) => void;
}

export const CashFlowRadarView: React.FC<Props> = ({
  mandates,
  liquidBalance,
  monthlySalary,
  onSelectMitigation,
}) => {
  const [cushion, setCushion] = useState(25000);

  // Compute collisions based on real state
  const collisions = detectCashFlowCollisions({
    currentLiquidBalance: liquidBalance,
    expectedSalary: {
      amount: monthlySalary,
      expectedDate: '2026-11-07',
      source: 'Infosys CTC Payroll',
    },
    mandates,
    cushionThreshold: cushion,
  });

  const criticalCount = collisions.filter(c => c.severity === 'CRITICAL_SHORTFALL').length;
  const warningCount = collisions.filter(c => c.severity === 'TIGHT_BUFFER').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Radio className="w-64 h-64 text-cyan-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-1">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Predictive Early-Warning System</span>
            </div>
            <h2 className="text-xl font-bold text-white">Cash-Flow Collision Radar</h2>
            <p className="text-sm text-slate-400 max-w-2xl mt-1">
              Scans 30-day forward horizons for temporal overlaps where recurring EMIs, utility bills, and AutoPay debits cluster before anticipated salary credits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2 rounded-xl text-center">
              <div className="text-xs text-slate-400">Current Liquidity</div>
              <div className="text-base font-bold text-emerald-400 font-mono">
                ₹{liquidBalance.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2 rounded-xl text-center">
              <div className="text-xs text-slate-400">Salary Credit</div>
              <div className="text-base font-bold text-cyan-400 font-mono">
                Nov 07 (₹{monthlySalary.toLocaleString('en-IN')})
              </div>
            </div>
          </div>
        </div>

        {/* Severity Metrics Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${criticalCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
              <span className="text-slate-300 font-medium">
                {criticalCount > 0 ? `${criticalCount} Critical Shortfall Windows` : 'Zero Deficit Collisions'}
              </span>
            </div>
            {warningCount > 0 && (
              <div className="flex items-center space-x-1.5 text-amber-300">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>{warningCount} Tight Cushion Alerts</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 text-slate-400">
            <span>Safety Cushion Threshold:</span>
            <select
              value={cushion}
              onChange={(e) => setCushion(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none"
            >
              <option value={15000}>₹15,000</option>
              <option value={25000}>₹25,000 (Recommended)</option>
              <option value={50000}>₹50,000</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collision Alerts Feed */}
      {collisions.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">All Clear: No Cash-Flow Collisions Detected</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Your current liquid reserves of ₹{liquidBalance.toLocaleString('en-IN')} adequately cushion all scheduled UPI 2.0 mandates and EMIs prior to salary arrival.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Identified Collision Windows ({collisions.length})
          </div>

          {collisions.map((col) => (
            <div
              key={col.id}
              className={`rounded-2xl border p-5 transition-all ${
                col.severity === 'CRITICAL_SHORTFALL'
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : 'bg-amber-950/20 border-amber-500/40'
              }`}
            >
              {/* Collision Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    col.severity === 'CRITICAL_SHORTFALL'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">
                        Collision Date: {col.date}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        col.severity === 'CRITICAL_SHORTFALL'
                          ? 'bg-rose-500/30 text-rose-200 border border-rose-500/40'
                          : 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                      }`}>
                        {col.severity === 'CRITICAL_SHORTFALL' ? 'NEGATIVE DEFICIT THREAT' : 'BUFFER COMPRESSION'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {col.competingObligations.length} obligations due simultaneously totaling{' '}
                      <span className="font-mono text-white font-semibold">
                        ₹{col.totalObligationsDue.toLocaleString('en-IN')}
                      </span>{' '}
                      exceeds available buffer by{' '}
                      <span className="font-mono text-rose-400 font-bold">
                        ₹{col.projectedShortfall.toLocaleString('en-IN')}
                      </span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs font-mono">
                  <div>
                    <div className="text-[10px] text-slate-400">Pre-Debit Balance</div>
                    <div className="text-slate-200">₹{col.projectedBalanceBefore.toLocaleString('en-IN')}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="text-[10px] text-slate-400">Post-Debit Deficit</div>
                    <div className="text-rose-400 font-bold">
                      -₹{col.projectedShortfall.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Competing Obligations Breakdown */}
              <div className="py-4">
                <div className="text-xs text-slate-400 font-medium mb-2">Competing Debits Scheduled:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {col.competingObligations.map((ob) => (
                    <div
                      key={ob.id}
                      className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-medium text-white">{ob.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {ob.category} • Consequence: <span className="text-slate-300">{ob.consequenceOfDelay}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-white">₹{ob.amount.toLocaleString('en-IN')}</div>
                        {ob.isMandateLinked && (
                          <div className="text-[9px] text-cyan-400 font-mono">AutoPay Mandate</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Non-Destructive Mitigations */}
              <div className="pt-3 border-t border-slate-800/80">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-2.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Verified Safe Action Mitigations (Zero Credit-Score Penalty)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {col.mitigationStrategies.map((mit) => (
                    <div
                      key={mit.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{mit.title}</span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            +₹{mit.impactAmount.toLocaleString('en-IN')} Buffer
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{mit.description}</p>
                      </div>

                      <button
                        onClick={() => onSelectMitigation(mit, col)}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                      >
                        <span>Preview & Authorize Action</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
