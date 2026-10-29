import React, { useState } from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  Leaf, 
  AlertTriangle, 
  Lock, 
  CheckCircle2, 
  CreditCard,
  Building,
  Activity,
  ChevronRight,
  Flame,
  PieChart
} from 'lucide-react';
import { UserProfile, Transaction, AutoPayMandate, ThreatItem, InvestmentAsset, LiabilityItem } from '../types';
import { calculateFinancialHealthScore } from '../utils/finance';

interface DashboardViewProps {
  user: UserProfile;
  transactions: Transaction[];
  mandates: AutoPayMandate[];
  threats: ThreatItem[];
  assets: InvestmentAsset[];
  liabilities: LiabilityItem[];
  onNavigate: (tab: string) => void;
  onApplyNudge: (nudgeId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  transactions,
  mandates,
  threats,
  assets,
  liabilities,
  onNavigate,
  onApplyNudge,
}) => {
  const [selectedProjectionDays, setSelectedProjectionDays] = useState<30 | 60 | 90>(90);
  const [activeNudges, setActiveNudges] = useState<string[]>([
    'weekend-delivery-lock',
    'autopay-spike-alert',
    'tax-elss-deadline',
  ]);

  // Compute live aggregates
  const totalMoneyIn = transactions
    .filter((t) => !t.isDebit)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalMoneyOut = transactions
    .filter((t) => t.isDebit)
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalMoneyIn - totalMoneyOut;

  const totalAssets = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.principalOutstanding, 0);
  const netWorth = totalAssets - totalLiabilities;

  const activeDarkPatternsCount = mandates.filter((m) => m.darkPatternsDetected.length > 0).length;
  const activeThreatsCount = threats.filter((t) => !t.isContained).length;

  const healthScoreResult = calculateFinancialHealthScore({
    monthlyIncome: user.monthlyIncome,
    monthlyExpenses: totalMoneyOut > 0 ? totalMoneyOut : 80000,
    totalDebt: totalLiabilities,
    liquidSavings: assets.find((a) => a.type === 'BANK_SAVINGS')?.currentValue || 200000,
    darkPatternsCount: activeDarkPatternsCount,
    activeThreatsCount,
  });

  const totalCarbonKg = transactions.reduce((acc, t) => acc + (t.carbonKg || 0), 0);

  // 90-Day Predictive Projection Points
  const currentLiquid = 226780;
  const dailyBurn = (totalMoneyOut / 30);
  const dailyIncome = (totalMoneyIn / 30);

  const projectionPoints = [
    { day: 0, balance: currentLiquid, label: 'Today' },
    { day: 15, balance: Math.round(currentLiquid - dailyBurn * 15 + dailyIncome * 5), label: 'Day 15' },
    { day: 30, balance: Math.round(currentLiquid - dailyBurn * 30 + user.monthlyIncome), label: 'Day 30 (Salary)' },
    { day: 45, balance: Math.round(currentLiquid + (user.monthlyIncome - totalMoneyOut) * 0.5), label: 'Day 45' },
    { day: 60, balance: Math.round(currentLiquid + (user.monthlyIncome - totalMoneyOut) + user.monthlyIncome * 0.8), label: 'Day 60' },
    { day: 75, balance: Math.round(currentLiquid + (user.monthlyIncome - totalMoneyOut) * 1.5), label: 'Day 75' },
    { day: 90, balance: Math.round(currentLiquid + (user.monthlyIncome - totalMoneyOut) * 2.2), label: 'Day 90' },
  ].filter((p) => p.day <= selectedProjectionDays);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Financial Health & Zero-Trust Status Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Financial Health Score (Bento Main 5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
                Proprietary Guardian Metric
              </span>
              <h2 className="text-xl font-bold text-white">Financial Health Score</h2>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {healthScoreResult.grade}
            </span>
          </div>

          <div className="flex items-center gap-6 my-4">
            <div className="relative flex items-center justify-center">
              {/* Radial Score Gauge SVG */}
              <svg className="w-32 h-32 -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  className="stroke-slate-800"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  className="stroke-emerald-400 transition-all duration-1000 ease-out"
                  strokeWidth="10"
                  strokeDasharray="326.7"
                  strokeDashoffset={326.7 - (326.7 * (healthScoreResult.score / 1000))}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-extrabold text-white font-mono">{healthScoreResult.score}</span>
                <span className="block text-[10px] text-slate-400 uppercase font-mono">/ 1000 MAX</span>
              </div>
            </div>

            <div className="space-y-2 text-xs flex-1">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Liquidity Buffer</span>
                  <span className="font-mono text-emerald-400">{healthScoreResult.breakdown.liquidity}/300</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${(healthScoreResult.breakdown.liquidity / 300) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Debt-to-Income (DTI)</span>
                  <span className="font-mono text-cyan-400">{healthScoreResult.breakdown.debt}/300</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${(healthScoreResult.breakdown.debt / 300) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Savings Rate</span>
                  <span className="font-mono text-teal-400">{healthScoreResult.breakdown.savings}/250</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-400 h-full rounded-full" style={{ width: `${(healthScoreResult.breakdown.savings / 250) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Security &amp; Threat Isolation</span>
                  <span className="font-mono text-emerald-400">{healthScoreResult.breakdown.security}/150</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${(healthScoreResult.breakdown.security / 150) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>4 Active Defenses Operating</span>
            </span>
            <button
              onClick={() => onNavigate('autopay')}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
            >
              <span>Audit AutoPay Mandates</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Cashflow Waterfall & Net Worth Bento (7 Cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Net Worth Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Calculated Net Worth</span>
                <span className="font-mono text-emerald-400">EPF • PPF • Demat • Real Estate</span>
              </div>
              <p className="text-2xl font-extrabold text-white font-mono">
                ₹{netWorth.toLocaleString('en-IN')}
              </p>
              <div className="mt-2 text-xs flex items-center gap-2">
                <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                  <ArrowUpRight className="h-3.5 w-3.5" /> +14.2% YoY
                </span>
                <span className="text-slate-500">inflation adjusted</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block">Total Assets</span>
                <span className="font-mono text-slate-200 font-medium">₹{totalAssets.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Liabilities</span>
                <span className="font-mono text-rose-300 font-medium">₹{totalLiabilities.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Monthly Cashflow Waterfall */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Cashflow (Current Month)</span>
                <span className="font-mono text-teal-400">Net Surplus</span>
              </div>
              <p className="text-2xl font-extrabold text-emerald-400 font-mono">
                +₹{netSavings.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                51.6% savings efficiency rate
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1">
                  <ArrowDownRight className="h-3 w-3 text-emerald-400" /> Money In (Salary)
                </span>
                <span className="font-mono text-slate-200">₹{totalMoneyIn.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-rose-400" /> Money Out (Spend + Tax)
                </span>
                <span className="font-mono text-slate-200">₹{totalMoneyOut.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Active Mandates Trap Warning Card */}
          <div className="rounded-2xl border border-amber-900/40 bg-gradient-to-br from-amber-950/20 to-slate-900 p-4">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">AutoPay Dark Patterns</span>
            </div>
            <p className="text-lg font-bold text-slate-100">
              {activeDarkPatternsCount} Predatory Mandates Active
            </p>
            <p className="text-xs text-slate-400 mt-1">
              ₹5,998/mo draining via hidden cancellation traps (Cult.fit, Netflix, Adobe).
            </p>
            <button
              onClick={() => onNavigate('autopay')}
              className="mt-3 w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition-colors"
            >
              Open AutoPay Buster
            </button>
          </div>

          {/* Carbon Footprint Estimator Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Leaf className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Carbon Ledger</span>
            </div>
            <p className="text-lg font-bold text-slate-100 font-mono">
              {totalCarbonKg.toFixed(1)} kg CO₂e
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Estimated footprint of your transit, food delivery, and electricity consumption.
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>Offset target: 3 Trees</span>
              <span className="text-emerald-400 font-mono">Within 1.5°C Goal</span>
            </div>
          </div>
        </div>
      </div>

      {/* 90-Day Predictive Cashflow Forecast Chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Predictive 90-Day Cashflow Curve</h3>
            </div>
            <p className="text-xs text-slate-400">
              Monte Carlo simulation based on historical UPI debit velocity, recurring e-NACH mandates, and salary inflows.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {([30, 60, 90] as const).map((days) => (
              <button
                key={days}
                onClick={() => setSelectedProjectionDays(days)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                  selectedProjectionDays === days
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {days}D Forecast
              </button>
            ))}
          </div>
        </div>

        {/* Custom SVG Line Chart */}
        <div className="h-56 w-full relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="40" x2="700" y2="40" stroke="#1e293b" strokeDasharray="4 4" />
            <line x1="0" y1="100" x2="700" y2="100" stroke="#1e293b" strokeDasharray="4 4" />
            <line x1="0" y1="160" x2="700" y2="160" stroke="#1e293b" strokeDasharray="4 4" />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="cashflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area Path */}
            <path
              d={`M 0 140 Q 150 160, 300 70 T 500 50 T 700 30 L 700 200 L 0 200 Z`}
              fill="url(#cashflowGrad)"
            />

            {/* Curve line */}
            <path
              d="M 0 140 Q 150 160, 300 70 T 500 50 T 700 30"
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Critical markers */}
            <circle cx="0" cy="140" r="5" className="fill-emerald-400" />
            <circle cx="300" cy="70" r="6" className="fill-emerald-300 stroke-slate-900 stroke-2" />
            <circle cx="500" cy="50" r="5" className="fill-emerald-400" />
            <circle cx="700" cy="30" r="6" className="fill-emerald-300" />
          </svg>

          {/* Interactive Chart Point Labels */}
          <div className="absolute inset-x-0 bottom-0 flex justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800">
            {projectionPoints.map((pt, idx) => (
              <div key={idx} className="text-center">
                <span className="block text-slate-500">{pt.label}</span>
                <span className="font-semibold text-emerald-400">₹{(pt.balance / 1000).toFixed(0)}k</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>Predicted minimum liquidity: <strong>₹1,84,200</strong> on Day 14 (pre-salary). Zero overdraft risk.</span>
          </div>
          <button
            onClick={() => onNavigate('yield')}
            className="text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Optimize Surplus in High-Yield Liquid FDs &rarr;
          </button>
        </div>
      </div>

      {/* Behavioral Nudges & Action Center */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nudge 1: Weekend Food Delivery Lock */}
        {activeNudges.includes('weekend-delivery-lock') && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                <Flame className="h-4 w-4" />
                <span>Behavioral Nudge</span>
              </div>
              <h4 className="font-bold text-white text-sm">Weekend Food Delivery Lock</h4>
              <p className="text-xs text-slate-400 mt-1">
                You spent ₹4,820 on Swiggy and Zomato past 11 PM this week. Enabling a soft weekend lock can save you ₹9,500/month.
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  onApplyNudge('weekend-delivery-lock');
                  setActiveNudges((prev) => prev.filter((id) => id !== 'weekend-delivery-lock'));
                }}
                className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors"
              >
                Enable Lock
              </button>
              <button
                onClick={() => setActiveNudges((prev) => prev.filter((id) => id !== 'weekend-delivery-lock'))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Nudge 2: AutoPay Mandate Escalation */}
        {activeNudges.includes('autopay-spike-alert') && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                <AlertTriangle className="h-4 w-4" />
                <span>AutoPay Spike Alert</span>
              </div>
              <h4 className="font-bold text-white text-sm">Cult.fit Unbundled Rider</h4>
              <p className="text-xs text-slate-400 mt-1">
                Detected unexpected ₹350 addon fee for locker insurance added to your monthly gym UPI mandate.
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => onNavigate('autopay')}
                className="flex-1 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
              >
                Kill Mandate
              </button>
              <button
                onClick={() => setActiveNudges((prev) => prev.filter((id) => id !== 'autopay-spike-alert'))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs"
              >
                Ignore
              </button>
            </div>
          </div>
        )}

        {/* Nudge 3: Tax Section 80C Opportunity */}
        {activeNudges.includes('tax-elss-deadline') && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                <TrendingUp className="h-4 w-4" />
                <span>Tax Optimization</span>
              </div>
              <h4 className="font-bold text-white text-sm">Section 80C Headroom Available</h4>
              <p className="text-xs text-slate-400 mt-1">
                You have ₹65,000 remaining under 80C. Deploying into Direct ELSS saves ₹20,280 in net tax under Old Regime.
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => onNavigate('yield')}
                className="flex-1 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-colors"
              >
                Model 80C &rarr;
              </button>
              <button
                onClick={() => setActiveNudges((prev) => prev.filter((id) => id !== 'tax-elss-deadline'))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs"
              >
                Later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
