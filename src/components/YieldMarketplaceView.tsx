import React, { useState } from 'react';
import { 
  TrendingUp, 
  Percent, 
  ShieldCheck, 
  Calculator, 
  Sparkles, 
  ArrowRight, 
  HelpCircle,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { 
  calculateIndianTaxRegime, 
  calculateMutualFundFeeDrag, 
  calculateSipWealth 
} from '../utils/finance';
import { soundFx } from '../utils/sound';

export const YieldMarketplaceView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'TAX_REGIME' | 'FEE_ANALYZER' | 'SIP_CALCULATOR'>('TAX_REGIME');

  // Tax Simulator State
  const [grossSalary, setGrossSalary] = useState(1800000); // 18 Lakhs
  const [sec80C, setSec80C] = useState(150000);
  const [sec80D, setSec80D] = useState(25000);
  const [hra, setHra] = useState(180000);

  // Fee Drag Simulator State
  const [sipMonthly, setSipMonthly] = useState(20000);
  const [sipYears, setSipYears] = useState(15);
  const [expectedReturn, setExpectedReturn] = useState(13);

  // SIP Step-Up Calculator State
  const [calcMonthly, setCalcMonthly] = useState(15000);
  const [calcYears, setCalcYears] = useState(20);
  const [calcReturn, setCalcReturn] = useState(12);
  const [calcStepUp, setCalcStepUp] = useState(10); // 10% annual step-up

  const taxResult = calculateIndianTaxRegime({
    grossSalary,
    section80C: sec80C,
    section80D: sec80D,
    hraExemption: hra,
  });

  const feeDragResult = calculateMutualFundFeeDrag(sipMonthly, sipYears, expectedReturn);
  const sipResult = calculateSipWealth(calcMonthly, calcReturn, calcYears, calcStepUp);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Subnav Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-xl font-bold text-white">Yield Engine &amp; Indian Tax Sovereignty</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Algorithmic wealth preservation: Compare tax regimes, expose distributor mutual fund commissions, and compound your wealth.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          {[
            { id: 'TAX_REGIME', label: 'Old vs New Tax Regime' },
            { id: 'FEE_ANALYZER', label: 'Mutual Fund Fee Drag' },
            { id: 'SIP_CALCULATOR', label: 'SIP Step-Up Wealth' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundFx.playShieldArmed();
                setActiveSubTab(tab.id as typeof activeSubTab);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeSubTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Old vs New Tax Regime Comparison */}
      {activeSubTab === 'TAX_REGIME' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-emerald-400" />
                <span>Income &amp; Deductions Modeler</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Finance Act FY 2024-25 &amp; FY 2025-26 rules: Revised Standard Deduction of ₹75,000 and 87A rebates incorporated.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1.5 font-medium">
                  <span>Annual Gross Salary / CTC:</span>
                  <span className="font-mono text-emerald-400 font-bold">₹{grossSalary.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="500000"
                  max="5000000"
                  step="50000"
                  value={grossSalary}
                  onChange={(e) => setGrossSalary(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1.5 font-medium">
                  <span>Section 80C Deductions (PPF, ELSS, EPF):</span>
                  <span className="font-mono text-cyan-400 font-bold">₹{sec80C.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150000"
                  step="10000"
                  value={sec80C}
                  onChange={(e) => setSec80C(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1.5 font-medium">
                  <span>Section 80D Health Insurance:</span>
                  <span className="font-mono text-teal-400 font-bold">₹{sec80D.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="75000"
                  step="5000"
                  value={sec80D}
                  onChange={(e) => setSec80D(Number(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1.5 font-medium">
                  <span>HRA Exemption / Rent Paid:</span>
                  <span className="font-mono text-emerald-400 font-bold">₹{hra.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="400000"
                  step="20000"
                  value={hra}
                  onChange={(e) => setHra(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="text-slate-300 font-semibold block">Regulatory Transparency:</span>
              <p>Under the New Tax Regime, no tax is payable on taxable income up to ₹7,00,000 (standard deduction ₹75,000 allows zero tax up to ₹7.75 Lakhs gross).</p>
            </div>
          </div>

          {/* Results Comparison (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className={`rounded-2xl border p-6 space-y-4 shadow-xl ${
              taxResult.recommendedRegime === 'NEW'
                ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 to-slate-900'
                : 'border-cyan-500/40 bg-gradient-to-br from-cyan-950/20 to-slate-900'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono font-semibold uppercase text-emerald-400">
                    Algorithmic Verdict
                  </span>
                  <h4 className="text-xl font-bold text-white">
                    {taxResult.recommendedRegime === 'NEW' ? 'Opt for the New Tax Regime' : 'Retain the Old Tax Regime'}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Annual Tax Saved:</span>
                  <span className="text-xl font-extrabold text-emerald-400 font-mono">
                    ₹{taxResult.annualSavings.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Side by side comparison cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Old Regime Card */}
                <div className={`p-4 rounded-xl border ${
                  taxResult.recommendedRegime === 'OLD'
                    ? 'border-emerald-500/50 bg-slate-950'
                    : 'border-slate-800 bg-slate-950/60 opacity-80'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white">Old Regime</span>
                    {taxResult.recommendedRegime === 'OLD' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                        BEST CHOICE
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Taxable Income:</span>
                      <span className="text-slate-200">₹{taxResult.oldRegime.taxableIncome.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Base Income Tax:</span>
                      <span className="text-slate-200">₹{taxResult.oldRegime.baseTax.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Health &amp; Edu Cess (4%):</span>
                      <span className="text-slate-200">₹{taxResult.oldRegime.cess.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-xs text-white">
                      <span>Total Liability:</span>
                      <span className="text-rose-300">₹{taxResult.oldRegime.totalTax.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* New Regime Card */}
                <div className={`p-4 rounded-xl border ${
                  taxResult.recommendedRegime === 'NEW'
                    ? 'border-emerald-500/50 bg-slate-950'
                    : 'border-slate-800 bg-slate-950/60 opacity-80'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white">New Regime (FY 2024-26)</span>
                    {taxResult.recommendedRegime === 'NEW' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                        BEST CHOICE
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Taxable Income:</span>
                      <span className="text-slate-200">₹{taxResult.newRegime.taxableIncome.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Base Income Tax:</span>
                      <span className="text-slate-200">₹{taxResult.newRegime.baseTax.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Health &amp; Edu Cess (4%):</span>
                      <span className="text-slate-200">₹{taxResult.newRegime.cess.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-xs text-white">
                      <span>Total Liability:</span>
                      <span className="text-emerald-400">₹{taxResult.newRegime.totalTax.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Mutual Fund Fee Drag Exposer */}
      {activeSubTab === 'FEE_ANALYZER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div>
              <h3 className="font-bold text-white text-base">Mutual Fund Expense Ratio Audit</h3>
              <p className="text-xs text-slate-400 mt-1">
                Regular Plans pay distributor commissions (1.2% - 1.8% annually) deducted directly from your NAV. Direct plans eliminate intermediaries completely.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1.5 font-medium">
                  <span>Monthly SIP Amount:</span>
                  <span className="font-mono text-emerald-400 font-bold">₹{sipMonthly.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="100000"
                  step="1000"
                  value={sipMonthly}
                  onChange={(e) => setSipMonthly(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1.5 font-medium">
                  <span>Investment Horizon (Years):</span>
                  <span className="font-mono text-cyan-400 font-bold">{sipYears} Years</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={sipYears}
                  onChange={(e) => setSipYears(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1.5 font-medium">
                  <span>Benchmark CAGR Return (%):</span>
                  <span className="font-mono text-teal-400 font-bold">{expectedReturn}%</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="18"
                  step="0.5"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-rose-900/40 bg-gradient-to-br from-rose-950/20 to-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono font-semibold uppercase text-rose-400">
                  Hidden Intermediary Commission Loss
                </span>
                <h4 className="text-xl font-bold text-white">
                  ₹{feeDragResult.commissionLost.toLocaleString('en-IN')} Lost to Regular Plans
                </h4>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {feeDragResult.percentageLost}% Wealth Erosion
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/40">
                <span className="text-slate-400 block">Direct Mutual Fund Value:</span>
                <span className="text-xl font-bold text-emerald-400 block mt-1">
                  ₹{feeDragResult.directCorpus.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-500">Expense Ratio ~0.35%</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-rose-900/40">
                <span className="text-slate-400 block">Regular Plan (Distributor) Value:</span>
                <span className="text-xl font-bold text-rose-400 block mt-1">
                  ₹{feeDragResult.regularCorpus.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-500">Expense Ratio ~1.75%</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed pt-2">
              MoneyShield OS algorithmically verifies portfolio ISIN codes. Switching to Direct Growth plans requires zero advisory lock-in and retains 100% of compounding gains.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: SIP Step-Up Calculator */}
      {activeSubTab === 'SIP_CALCULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h3 className="font-bold text-white text-base">SIP Step-Up Calculator</h3>
            <p className="text-xs text-slate-400">
              Increasing your SIP by even 10% annually with salary hikes multiplies your final retirement corpus dramatically.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1 font-medium">
                  <span>Starting Monthly SIP:</span>
                  <span className="font-mono text-emerald-400 font-bold">₹{calcMonthly.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="100000"
                  step="1000"
                  value={calcMonthly}
                  onChange={(e) => setCalcMonthly(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1 font-medium">
                  <span>Annual Step-Up (%):</span>
                  <span className="font-mono text-cyan-400 font-bold">{calcStepUp}% / Year</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="5"
                  value={calcStepUp}
                  onChange={(e) => setCalcStepUp(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1 font-medium">
                  <span>Horizon (Years):</span>
                  <span className="font-mono text-teal-400 font-bold">{calcYears} Years</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="35"
                  step="1"
                  value={calcYears}
                  onChange={(e) => setCalcYears(Number(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-semibold uppercase text-emerald-400">
                Projected Maturity Corpus
              </span>
              <p className="text-3xl font-extrabold text-white font-mono mt-1">
                ₹{sipResult.estimatedMaturityValue.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block">Total Capital Invested:</span>
                <span className="text-lg font-bold text-slate-200 block mt-1">
                  ₹{sipResult.totalInvested.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/40">
                <span className="text-slate-400 block">Wealth Gain (Interest/Growth):</span>
                <span className="text-lg font-bold text-emerald-400 block mt-1">
                  +₹{sipResult.wealthGain.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
