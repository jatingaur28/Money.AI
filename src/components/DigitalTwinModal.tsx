/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DigitalTwinScenario } from '../types/intelligence';
import { simulateDigitalTwin, DigitalTwinBaseState } from '../utils/digitalTwin';
import { Cpu, X, Play, RefreshCw, AlertTriangle, ShieldCheck, ArrowRight, TrendingDown } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  baseState: DigitalTwinBaseState;
}

const SCENARIO_PRESETS: DigitalTwinScenario[] = [
  {
    id: 'scen-salary-delay',
    name: '10-Day Payroll Delay',
    description: 'Corporate payroll delayed by 10 days while rent and mandates debit on schedule.',
    salaryDelayDays: 10,
    rentHikePercent: 0,
    equityMarketShockPercent: 0,
    lumpSumExpenseAmount: 0,
    prepayDebtAmount: 0,
  },
  {
    id: 'scen-rent-spike',
    name: '15% Rent Spike + Emergency Medical',
    description: 'Rent increases by 15% along with an unforeseen ₹60,000 medical dental emergency.',
    salaryDelayDays: 0,
    rentHikePercent: 15,
    equityMarketShockPercent: 0,
    lumpSumExpenseAmount: 60000,
    prepayDebtAmount: 0,
  },
  {
    id: 'scen-market-shock',
    name: '20% Market Crash (LAS Margin Stress)',
    description: 'Nifty 50 drops 20%, reducing Loan Against Securities (LAS) collateral buffer.',
    salaryDelayDays: 0,
    rentHikePercent: 0,
    equityMarketShockPercent: -20,
    lumpSumExpenseAmount: 0,
    prepayDebtAmount: 0,
  },
];

export const DigitalTwinModal: React.FC<Props> = ({ isOpen, onClose, baseState }) => {
  const [selectedPresetId, setSelectedPresetId] = useState(SCENARIO_PRESETS[0].id);
  const [salaryDelayDays, setSalaryDelayDays] = useState(SCENARIO_PRESETS[0].salaryDelayDays);
  const [rentHikePercent, setRentHikePercent] = useState(SCENARIO_PRESETS[0].rentHikePercent);
  const [marketShockPercent, setMarketShockPercent] = useState(SCENARIO_PRESETS[0].equityMarketShockPercent);
  const [lumpSumExpense, setLumpSumExpense] = useState(SCENARIO_PRESETS[0].lumpSumExpenseAmount);
  const [prepayDebt, setPrepayDebt] = useState(SCENARIO_PRESETS[0].prepayDebtAmount);

  if (!isOpen) return null;

  const currentScenario: DigitalTwinScenario = {
    id: 'custom-scenario',
    name: 'Interactive Sandbox Scenario',
    description: 'Custom user stress configuration',
    salaryDelayDays,
    rentHikePercent,
    equityMarketShockPercent: marketShockPercent,
    lumpSumExpenseAmount: lumpSumExpense,
    prepayDebtAmount: prepayDebt,
  };

  const result = simulateDigitalTwin(baseState, currentScenario);

  const applyPreset = (preset: DigitalTwinScenario) => {
    setSelectedPresetId(preset.id);
    setSalaryDelayDays(preset.salaryDelayDays);
    setRentHikePercent(preset.rentHikePercent);
    setMarketShockPercent(preset.equityMarketShockPercent);
    setLumpSumExpense(preset.lumpSumExpenseAmount);
    setPrepayDebt(preset.prepayDebtAmount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Personal Financial Digital Twin</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Zero Ledger Mutation
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Stress-test cash flow resilience under macro shocks, payroll delays, and emergency outflows
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Preset Buttons */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Stress Preset:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {SCENARIO_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedPresetId === preset.id
                      ? 'bg-cyan-950/40 border-cyan-500/60 text-white'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold">{preset.name}</div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
            {/* Slider 1: Salary Delay */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Salary Timing Delay:</span>
                <span className="font-mono text-cyan-400 font-bold">{salaryDelayDays} Days</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                value={salaryDelayDays}
                onChange={(e) => {
                  setSelectedPresetId('custom');
                  setSalaryDelayDays(Number(e.target.value));
                }}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0d (On Time)</span>
                <span>10d</span>
                <span>20d Lag</span>
              </div>
            </div>

            {/* Slider 2: Rent Hike */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Rent Increase:</span>
                <span className="font-mono text-cyan-400 font-bold">+{rentHikePercent}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={rentHikePercent}
                onChange={(e) => {
                  setSelectedPresetId('custom');
                  setRentHikePercent(Number(e.target.value));
                }}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0% (Constant)</span>
                <span>15%</span>
                <span>+30% Spike</span>
              </div>
            </div>

            {/* Slider 3: Equity Shock */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Equity Portfolio Shock:</span>
                <span className={`font-mono font-bold ${marketShockPercent < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {marketShockPercent}%
                </span>
              </div>
              <input
                type="range"
                min={-35}
                max={0}
                value={marketShockPercent}
                onChange={(e) => {
                  setSelectedPresetId('custom');
                  setMarketShockPercent(Number(e.target.value));
                }}
                className="w-full accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>-35% (Crash)</span>
                <span>-15%</span>
                <span>0% (Neutral)</span>
              </div>
            </div>

            {/* Slider 4: Lump Sum Emergency Outflow */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Unplanned Emergency Outflow:</span>
                <span className="font-mono text-cyan-400 font-bold">₹{lumpSumExpense.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={0}
                max={250000}
                step={10000}
                value={lumpSumExpense}
                onChange={(e) => {
                  setSelectedPresetId('custom');
                  setLumpSumExpense(Number(e.target.value));
                }}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>₹0</span>
                <span>₹1,25,000</span>
                <span>₹2,50,000</span>
              </div>
            </div>
          </div>

          {/* Simulation Outcome KPI Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700">
              <div className="text-[10px] text-slate-400">Baseline Min Balance</div>
              <div className="text-sm font-bold text-slate-200 font-mono mt-0.5">
                ₹{result.baselineMinBalance.toLocaleString('en-IN')}
              </div>
            </div>

            <div className={`p-3 rounded-xl border ${
              result.stressedMinBalance < 0
                ? 'bg-rose-950/30 border-rose-500/50 text-rose-300'
                : 'bg-slate-800/40 border-slate-700 text-slate-200'
            }`}>
              <div className="text-[10px] opacity-80">Stressed Min Balance</div>
              <div className="text-sm font-bold font-mono mt-0.5">
                {result.stressedMinBalance < 0 ? `-₹${Math.abs(result.stressedMinBalance).toLocaleString('en-IN')}` : `₹${result.stressedMinBalance.toLocaleString('en-IN')}`}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700">
              <div className="text-[10px] text-slate-400">First Deficit Day</div>
              <div className="text-sm font-bold font-mono mt-0.5 text-white">
                {result.firstDeficitDay || 'None (Buffer Intact)'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700">
              <div className="text-[10px] text-slate-400">Required Safety Cushion</div>
              <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                ₹{result.requiredEmergencyBuffer.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Insights Callout */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Diagnostic Synthesis & Recommendations:
            </div>
            {result.actionableInsights.map((insight, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-slate-200 flex items-start space-x-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span className="text-xs">{insight}</span>
              </div>
            ))}
          </div>

          {/* Day-by-Day Micro Projections (First 15 Days Preview) */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Timeline Trajectory (Days 1 - 15)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px]">
                    <th className="py-1.5">Date</th>
                    <th className="py-1.5">Baseline</th>
                    <th className="py-1.5">Stressed Balance</th>
                    <th className="py-1.5">Event / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {result.projections.slice(0, 15).map((p) => (
                    <tr key={p.dayIndex} className={p.isDeficit ? 'bg-rose-500/10 text-rose-300' : 'text-slate-300'}>
                      <td className="py-1.5">{p.date}</td>
                      <td className="py-1.5 text-slate-400">₹{p.baselineBalance.toLocaleString('en-IN')}</td>
                      <td className={`py-1.5 font-bold ${p.isDeficit ? 'text-rose-400' : 'text-white'}`}>
                        ₹{p.stressedBalance.toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 text-[10px] text-slate-400 font-sans">
                        {p.stressFactorNote || (p.isDeficit ? 'DEFICIT WINDOW' : 'Normal')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Simulations are purely mathematical; no actual transactions or ledger mutations occurred.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium cursor-pointer"
          >
            Close Sandbox
          </button>
        </div>
      </div>
    </div>
  );
};
