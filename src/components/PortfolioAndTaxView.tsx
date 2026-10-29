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
  AlertCircle,
  Coins,
  Landmark,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Unlock,
  CheckCircle2,
  ExternalLink,
  Plus,
  Zap,
  Info,
  Calendar,
  DollarSign,
  AlertTriangle,
  Flame,
  Award,
  PieChart,
  Sliders,
  RefreshCw,
  BarChart3,
  Download,
  FileText,
  ShieldAlert,
  Target,
  CheckCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  InvestmentAsset, 
  LoanAgainstSecurities, 
  AITaxSuggestion, 
  UserProfile,
  RiskProfileType,
  InvestmentHorizonType,
  PortfolioGoalType,
  PortfolioDesignerPlan,
  AdvancedTaxPlanResult
} from '../types';
import { 
  calculateLasDrawingPower, 
  evaluateLasMarginHealth, 
  generateAITaxSavingSuggestions 
} from '../utils/portfolioAndTax';
import { 
  calculateIndianTaxRegime, 
  calculateMutualFundFeeDrag, 
  calculateSipWealth 
} from '../utils/finance';
import { generatePortfolioPlan } from '../utils/portfolioDesigner';
import { generateAdvancedTaxPlan } from '../utils/taxPlanner';
import { soundFx } from '../utils/sound';

interface PortfolioAndTaxViewProps {
  user: UserProfile;
  assets: InvestmentAsset[];
  lasLoans: LoanAgainstSecurities[];
  onAddAsset?: (asset: InvestmentAsset) => void;
  onPledgeForLas?: (assetId: string, amountToDraw: number) => void;
}

export const PortfolioAndTaxView: React.FC<PortfolioAndTaxViewProps> = ({
  user,
  assets,
  lasLoans: initialLasLoans,
  onAddAsset,
  onPledgeForLas,
}) => {
  const [mainTab, setMainTab] = useState<
    'PORTFOLIO_DESIGNER' | 'ADVANCED_TAX_PLANNER' | 'AI_TAX_INTELLIGENCE' | 'PORTFOLIO_ASSETS' | 'LAS_FACILITY' | 'TAX_REGIME_CALC'
  >('PORTFOLIO_DESIGNER');
  
  const [assetCategoryFilter, setAssetCategoryFilter] = useState<string>('ALL');
  const [lasLoans, setLasLoans] = useState<LoanAgainstSecurities[]>(initialLasLoans);

  // 1. Portfolio Designer State
  const [riskProfile, setRiskProfile] = useState<RiskProfileType>('AGGRESSIVE');
  const [horizon, setHorizon] = useState<InvestmentHorizonType>('LONG_TERM');
  const [portfolioGoal, setPortfolioGoal] = useState<PortfolioGoalType>('WEALTH_CREATION');
  const [monthlySip, setMonthlySip] = useState<number>(35000);
  const [isGeneratingPortfolio, setIsGeneratingPortfolio] = useState(false);
  const [designerPlan, setDesignerPlan] = useState<PortfolioDesignerPlan>(() => 
    generatePortfolioPlan({
      riskProfile: 'AGGRESSIVE',
      horizon: 'LONG_TERM',
      goal: 'WEALTH_CREATION',
      monthlySip: 35000,
      assets,
    })
  );

  // 2. Advanced Tax Planner State
  const [taxSalary, setTaxSalary] = useState<number>(user.monthlyIncome * 12);
  const [taxFreelance, setTaxFreelance] = useState<number>(0);
  const [taxStcg, setTaxStcg] = useState<number>(45000);
  const [taxLtcg, setTaxLtcg] = useState<number>(95000);
  const [tax80C, setTax80C] = useState<number>(150000);
  const [tax80CCD, setTax80CCD] = useState<number>(50000);
  const [tax80D, setTax80D] = useState<number>(25000);
  const [tax24b, setTax24b] = useState<number>(0);
  const [taxSeniorParents, setTaxSeniorParents] = useState<boolean>(false);
  const [taxTdsPaid, setTaxTdsPaid] = useState<number>(Math.round((user.monthlyIncome * 12) * 0.16));
  const [isGeneratingTax, setIsGeneratingTax] = useState<boolean>(false);
  const [harvestedAssetIds, setHarvestedAssetIds] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  const [advancedTaxPlan, setAdvancedTaxPlan] = useState<AdvancedTaxPlanResult>(() => 
    generateAdvancedTaxPlan({
      salaryIncome: user.monthlyIncome * 12,
      freelanceGrossRevenue: 0,
      capitalGainsStcg: 45000,
      capitalGainsLtcg: 95000,
      claimed80C: 150000,
      claimed80CCD1B: 50000,
      claimed80D: 25000,
      claimed24b: 0,
      hasSeniorParents: false,
      tdsAlreadyDeducted: Math.round((user.monthlyIncome * 12) * 0.16),
      assets,
    })
  );

  // 3. Tax Saving Quick Suggestions State
  const initialSuggestions = generateAITaxSavingSuggestions({
    grossAnnualIncome: user.monthlyIncome * 12,
    assets,
    declared80C: 65000,
    declared80D: 24500,
    declaredNps: 0,
    taxSlabRate: 0.312,
  });
  const [taxSuggestions, setTaxSuggestions] = useState<AITaxSuggestion[]>(initialSuggestions);
  const [appliedCount, setAppliedCount] = useState<number>(0);

  // 4. New Asset Pledge for LAS Modal
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [selectedPledgeAssetId, setSelectedPledgeAssetId] = useState<string>(
    assets.find((a) => !a.isPledgedForLoan && a.maxLtvPercent && a.maxLtvPercent > 0)?.id || ''
  );
  const [pledgeLoanAmount, setPledgeLoanAmount] = useState<number>(50000);

  // 5. Old vs New Tax Simulator State
  const [grossSalary, setGrossSalary] = useState(user.monthlyIncome * 12);
  const [sec80C, setSec80C] = useState(150000);
  const [sec80D, setSec80D] = useState(25000);
  const [hra, setHra] = useState(180000);

  // Portfolio Totals
  const totalPortfolioValue = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalInvestedValue = assets.reduce((sum, a) => sum + a.investedValue, 0);
  const totalUnrealizedPnl = totalPortfolioValue - totalInvestedValue;
  const totalPnlPercentage = totalInvestedValue > 0 ? ((totalUnrealizedPnl / totalInvestedValue) * 100).toFixed(1) : '0';

  // LAS Aggregates
  const totalCollateralPledged = lasLoans.reduce((sum, l) => sum + l.collateralValue, 0);
  const totalDrawingPower = lasLoans.reduce((sum, l) => sum + l.drawingPower, 0);
  const totalUtilizedLas = lasLoans.reduce((sum, l) => sum + l.utilizedAmount, 0);
  const availableCreditLine = totalDrawingPower - totalUtilizedLas;
  const totalInterestSavedAnnual = lasLoans.reduce((sum, l) => sum + l.interestSavedVsPersonalLoan, 0);

  // Filtered Assets
  const filteredAssets = assets.filter((a) => {
    if (assetCategoryFilter === 'ALL') return true;
    return a.type === assetCategoryFilter;
  });

  // Re-run Portfolio Designer
  const handleRecalculatePortfolio = async (
    rp = riskProfile,
    hz = horizon,
    gl = portfolioGoal,
    sip = monthlySip
  ) => {
    setIsGeneratingPortfolio(true);
    soundFx.playShieldArmed();

    try {
      const response = await fetch('/api/ai/portfolio-designer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riskProfile: rp,
          horizon: hz,
          goal: gl,
          monthlySip: sip,
          assets,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.plan) {
          setDesignerPlan(data.plan);
          setIsGeneratingPortfolio(false);
          return;
        }
      }
    } catch {
      // fallback to local calculation
    }

    const localPlan = generatePortfolioPlan({
      riskProfile: rp,
      horizon: hz,
      goal: gl,
      monthlySip: sip,
      assets,
    });
    setDesignerPlan(localPlan);
    setIsGeneratingPortfolio(false);
  };

  // Re-run Advanced Tax Planner
  const handleRecalculateTaxPlan = async () => {
    setIsGeneratingTax(true);
    soundFx.playShieldArmed();

    try {
      const response = await fetch('/api/ai/tax-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salaryIncome: taxSalary,
          freelanceGrossRevenue: taxFreelance,
          capitalGainsStcg: taxStcg,
          capitalGainsLtcg: taxLtcg,
          claimed80C: tax80C,
          claimed80CCD1B: tax80CCD,
          claimed80D: tax80D,
          claimed24b: tax24b,
          hasSeniorParents: taxSeniorParents,
          tdsAlreadyDeducted: taxTdsPaid,
          assets,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.plan) {
          setAdvancedTaxPlan(data.plan);
          setIsGeneratingTax(false);
          return;
        }
      }
    } catch {
      // fallback
    }

    const localTaxPlan = generateAdvancedTaxPlan({
      salaryIncome: taxSalary,
      freelanceGrossRevenue: taxFreelance,
      capitalGainsStcg: taxStcg,
      capitalGainsLtcg: taxLtcg,
      claimed80C: tax80C,
      claimed80CCD1B: tax80CCD,
      claimed80D: tax80D,
      claimed24b: tax24b,
      hasSeniorParents: taxSeniorParents,
      tdsAlreadyDeducted: taxTdsPaid,
      assets,
    });
    setAdvancedTaxPlan(localTaxPlan);
    setIsGeneratingTax(false);
  };

  // Handle Harvesting Tax Loss
  const handleHarvestLoss = (assetId: string) => {
    soundFx.playSavingsFanfare();
    setHarvestedAssetIds((prev) => [...prev, assetId]);
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b'],
      });
    } catch {}
  };

  // Handle Deploying Rebalanced SIP
  const handleDeployRebalance = () => {
    soundFx.playSavingsFanfare();
    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#10b981', '#3b82f6', '#ec4899'],
      });
    } catch {}
  };

  // Handle Apply Tax Suggestion
  const handleApplySuggestion = (sugId: string) => {
    soundFx.playSavingsFanfare();
    setTaxSuggestions((prev) =>
      prev.map((s) => (s.id === sugId ? { ...s, status: 'APPLIED' as const } : s))
    );
    setAppliedCount((c) => c + 1);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#06b6d4'],
      });
    } catch {}
  };

  // Handle Pledge Asset for LAS
  const handleConfirmPledge = () => {
    const asset = assets.find((a) => a.id === selectedPledgeAssetId);
    if (!asset) return;

    soundFx.playBiometricVerified();
    const ltvCalc = calculateLasDrawingPower(asset.type, asset.currentValue, asset.maxLtvPercent);
    const marginEval = evaluateLasMarginHealth(asset.currentValue, pledgeLoanAmount, ltvCalc.ltvPercent);
    const newLas: LoanAgainstSecurities = {
      id: `las-${Date.now().toString().slice(-4)}`,
      assetId: asset.id,
      assetName: `${asset.name} (${asset.type})`,
      assetType: asset.type,
      collateralValue: asset.currentValue,
      approvedLtvPercent: ltvCalc.ltvPercent,
      drawingPower: ltvCalc.drawingPower,
      utilizedAmount: pledgeLoanAmount,
      interestRate: ltvCalc.annualInterestRate,
      monthlyInterestDue: Math.round((pledgeLoanAmount * (ltvCalc.annualInterestRate / 100)) / 12),
      marginHealth: marginEval.marginHealth,
      interestSavedVsPersonalLoan: Math.round(pledgeLoanAmount * ((16.0 - ltvCalc.annualInterestRate) / 100)),
      lenderEntity: 'NPCI Depository Escrow Link',
    };

    setLasLoans((prev) => [newLas, ...prev]);
    setShowPledgeModal(false);

    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.5 },
      });
    } catch {}
  };

  // Tax Simulator calculation (Old vs New)
  const regimeComparison = calculateIndianTaxRegime({
    grossSalary,
    section80C: sec80C,
    section80D: sec80D,
    hraExemption: hra,
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-emerald-400">
                WEALTH SOVEREIGNTY &amp; AI INTELLIGENCE
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">
              AI Portfolio Designer &amp; Advanced Tax Shield
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Modern Portfolio Theory (MPT) asset allocation, real-time portfolio drift correction, multi-source tax optimization (80C, 80D, 80CCD, 44ADA), and instant credit lines via Loans Against Securities (LAS).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-mono block">Aggregate Portfolio Value</span>
              <span className="text-2xl font-black text-white font-mono">
                ₹{totalPortfolioValue.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-emerald-400 font-mono font-semibold flex items-center justify-end gap-1 mt-0.5">
                <ArrowUpRight className="h-3 w-3" /> +₹{totalUnrealizedPnl.toLocaleString('en-IN')} ({totalPnlPercentage}%)
              </span>
            </div>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
          {[
            { id: 'PORTFOLIO_DESIGNER', label: 'AI Portfolio Designer', icon: PieChart, badge: `${designerPlan.expectedAnnualReturn}% CAGR Target` },
            { id: 'ADVANCED_TAX_PLANNER', label: 'Advanced AI Tax Planner', icon: FileCheck2, badge: `Saves ₹${advancedTaxPlan.netTaxSaved.toLocaleString('en-IN')}` },
            { id: 'AI_TAX_INTELLIGENCE', label: 'Tax Deductions Audit', icon: Sparkles, badge: `${taxSuggestions.length} Opportunities` },
            { id: 'PORTFOLIO_ASSETS', label: 'All Instruments', icon: Landmark, badge: `${assets.length} Assets` },
            { id: 'LAS_FACILITY', label: 'Loan Against Securities (LAS)', icon: Coins, badge: `₹${(availableCreditLine / 1000).toFixed(0)}k Credit Line` },
            { id: 'TAX_REGIME_CALC', label: 'Regime Simulator', icon: Calculator, badge: 'FY 2024-26' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = mainTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundFx.playShieldArmed();
                  setMainTab(tab.id as typeof mainTab);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    isActive ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AI PORTFOLIO DESIGNER */}
      {/* ========================================================================= */}
      {mainTab === 'PORTFOLIO_DESIGNER' && (
        <div className="space-y-6">
          {/* Executive Overview Bento Card */}
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <PieChart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Modern Portfolio Theory Asset Allocation Blueprint
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                      Gemini Verified
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Engineered for high alpha compounding, macro downside immunity, and immediate collateral liquidity.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleRecalculatePortfolio()}
                disabled={isGeneratingPortfolio}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-950 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isGeneratingPortfolio ? 'animate-spin' : ''}`} />
                {isGeneratingPortfolio ? 'Optimizing Frontier...' : 'Re-optimize with AI'}
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              {designerPlan.aiExecutiveSummary}
            </p>

            {/* Core Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block">Expected Annual CAGR</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {designerPlan.expectedAnnualReturn}%
                </span>
                <span className="text-[10px] text-slate-500 block">Inflation-adjusted: ~{designerPlan.expectedAnnualReturn - 6.0}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block">Sharpe Ratio (Risk Adj)</span>
                <span className="text-xl font-black text-sky-400 font-mono">
                  {designerPlan.sharpeRatio}
                </span>
                <span className="text-[10px] text-slate-500 block">Risk-free hurdle: 6.8%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block">Max Historical Drawdown</span>
                <span className="text-xl font-black text-amber-400 font-mono">
                  -{designerPlan.maxDrawdownRisk}%
                </span>
                <span className="text-[10px] text-slate-500 block">Under Black Swan Shock</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block">Target Monthly SIP</span>
                <span className="text-xl font-black text-white font-mono">
                  ₹{monthlySip.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-400 block">Discipline Rebalancer</span>
              </div>
            </div>
          </div>

          {/* Interactive Configuration Controls */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-400" />
              Tune Investment Parameters
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Risk Profile Selection */}
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-2">Risk Tolerance Profile</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE', 'ULTRA_GROWTH'] as RiskProfileType[]).map((rp) => (
                    <button
                      key={rp}
                      onClick={() => {
                        setRiskProfile(rp);
                        handleRecalculatePortfolio(rp, horizon, portfolioGoal, monthlySip);
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                        riskProfile === rp
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {rp === 'ULTRA_GROWTH' ? 'Ultra Growth' : rp.charAt(0) + rp.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Investment Horizon */}
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-2">Investment Horizon</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'SHORT_TERM', label: '1 - 3 Years' },
                    { id: 'MEDIUM_TERM', label: '3 - 5 Years' },
                    { id: 'LONG_TERM', label: '5 - 10 Years' },
                    { id: 'GENERATIONAL', label: '10+ Years' },
                  ].map((hz) => (
                    <button
                      key={hz.id}
                      onClick={() => {
                        setHorizon(hz.id as InvestmentHorizonType);
                        handleRecalculatePortfolio(riskProfile, hz.id as InvestmentHorizonType, portfolioGoal, monthlySip);
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                        horizon === hz.id
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {hz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monthly SIP Capacity */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-slate-300 font-medium">Monthly SIP Capacity</label>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    ₹{monthlySip.toLocaleString('en-IN')} / mo
                  </span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="100000"
                  step="2500"
                  value={monthlySip}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMonthlySip(val);
                    handleRecalculatePortfolio(riskProfile, horizon, portfolioGoal, val);
                  }}
                  className="w-full accent-emerald-500 bg-slate-950 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>₹5k</span>
                  <span>₹50k</span>
                  <span>₹100k</span>
                </div>
              </div>
            </div>
          </div>

          {/* Allocation Buckets & Drift Analysis */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                Target Allocation vs Current Holdings (Drift Analysis)
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                Auto-rebalancing via ₹{monthlySip.toLocaleString('en-IN')}/mo SIP
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {designerPlan.buckets.map((b) => {
                const isOverweight = b.rebalanceAction === 'TRIM';
                const isUnderweight = b.rebalanceAction === 'BUY';

                return (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-white leading-snug">{b.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            isOverweight
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : isUnderweight
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {b.rebalanceAction === 'BUY'
                            ? `BUY (${b.driftPercent}%)`
                            : b.rebalanceAction === 'TRIM'
                            ? `TRIM (+${b.driftPercent}%)`
                            : 'BALANCED'}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1 text-xs font-mono">
                        <div className="flex justify-between text-slate-400">
                          <span>Target Allocation:</span>
                          <span className="text-white font-bold">{b.targetPercent}% (₹{b.targetValue.toLocaleString('en-IN')})</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Current Holding:</span>
                          <span className="text-slate-300 font-medium">{b.currentPercent}% (₹{b.currentValue.toLocaleString('en-IN')})</span>
                        </div>
                      </div>

                      {/* Comparative Progress Bar */}
                      <div className="mt-2.5 h-2 w-full bg-slate-950 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${Math.min(100, b.currentPercent)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] font-mono">
                        <span className="text-slate-400">Monthly SIP Slice:</span>
                        <span className="text-emerald-400 font-bold">
                          ₹{b.suggestedMonthlySipAllocation.toLocaleString('en-IN')}/mo
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        Matched: {b.recommendedInstruments.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Macro Stress-Testing & Black Swan Simulation */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              Macro Stress Testing &amp; Black Swan Resilience
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {designerPlan.stressScenarios.map((scen) => (
                <div
                  key={scen.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200">{scen.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        scen.portfolioImpactPercent >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {scen.portfolioImpactPercent > 0 ? `+${scen.portfolioImpactPercent}%` : `${scen.portfolioImpactPercent}%`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{scen.triggerEvent}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-900 space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Estimated Portfolio Impact:</span>
                      <span className={`font-bold ${scen.estimatedValueChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {scen.estimatedValueChange >= 0 ? `+₹${scen.estimatedValueChange.toLocaleString('en-IN')}` : `-₹${Math.abs(scen.estimatedValueChange).toLocaleString('en-IN')}`}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      Strategy: {scen.recoveryStrategy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Blueprint & Deploy Rebalance */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-white block mb-1">
                Deploy Automated Rebalancing Blueprint
              </span>
              <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                {designerPlan.rebalancingBlueprint.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleDeployRebalance}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all shrink-0"
            >
              <Zap className="h-4 w-4" />
              Deploy Rebalanced AutoPay SIPs
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ADVANCED AI TAX PLANNER */}
      {/* ========================================================================= */}
      {mainTab === 'ADVANCED_TAX_PLANNER' && (
        <div className="space-y-6">
          {/* Hero Tax Verdict Card */}
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-base">
                    Optimal Tax Regime: {advancedTaxPlan.optimalRegime === 'NEW_REGIME' ? 'NEW TAX REGIME (Recommended)' : 'OLD TAX REGIME (Recommended)'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-semibold">
                    FY 2024-25 / FY 2025-26
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-xl">
                  {advancedTaxPlan.optimalRegime === 'NEW_REGIME'
                    ? `Choosing the New Tax Regime with revised ₹75,000 standard deduction and lower slabs saves you ₹${advancedTaxPlan.netTaxSaved.toLocaleString('en-IN')} in net cash compared to the Old Regime.`
                    : `Your substantial deductions (80C, 80D, NPS, Home Loan) exceed the break-even threshold. Old Regime saves you ₹${advancedTaxPlan.netTaxSaved.toLocaleString('en-IN')} net tax.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
              >
                <Download className="h-3.5 w-3.5" />
                Export Tax Pack for CA
              </button>
              <button
                onClick={handleRecalculateTaxPlan}
                disabled={isGeneratingTax}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-950 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isGeneratingTax ? 'animate-spin' : ''}`} />
                {isGeneratingTax ? 'Auditing...' : 'Run Deep AI Tax Audit'}
              </button>
            </div>
          </div>

          {/* Side-by-Side Regime Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-5 rounded-2xl border ${
              advancedTaxPlan.optimalRegime === 'NEW_REGIME' ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-slate-800 bg-slate-900/60'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">New Tax Regime</span>
                {advancedTaxPlan.optimalRegime === 'NEW_REGIME' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold">
                    RECOMMENDED CHOICE
                  </span>
                )}
              </div>
              <div className="text-3xl font-black font-mono text-white mb-2">
                ₹{advancedTaxPlan.newRegimeTotalTax.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400">
                Standard Deduction: ₹75,000 • Slabs: 0-3L (0%), 3-7L (5%), 7-10L (10%), 10-12L (15%), 12-15L (20%), &gt;15L (30%)
              </p>
            </div>

            <div className={`p-5 rounded-2xl border ${
              advancedTaxPlan.optimalRegime === 'OLD_REGIME' ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-slate-800 bg-slate-900/60'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Old Tax Regime</span>
                {advancedTaxPlan.optimalRegime === 'OLD_REGIME' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold">
                    RECOMMENDED CHOICE
                  </span>
                )}
              </div>
              <div className="text-3xl font-black font-mono text-white mb-2">
                ₹{advancedTaxPlan.oldRegimeTotalTax.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400">
                Claiming ₹{(tax80C + tax80CCD + tax80D + tax24b).toLocaleString('en-IN')} in Chapter VI-A &amp; Home Loan deductions
              </p>
            </div>
          </div>

          {/* Interactive Income & Chapter VI-A Controls */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-400" />
              Adjust CTC, Freelance &amp; Chapter VI-A Deductions
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Annual CTC Salary (₹):</label>
                <input
                  type="number"
                  value={taxSalary}
                  onChange={(e) => setTaxSalary(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Section 44ADA Freelance (₹):</label>
                <input
                  type="number"
                  value={taxFreelance}
                  onChange={(e) => setTaxFreelance(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">50% deemed taxable profit</span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Section 80C Claim (₹):</label>
                <input
                  type="number"
                  max="150000"
                  value={tax80C}
                  onChange={(e) => setTax80C(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">Max ₹1,50,000 cap</span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Section 80CCD(1B) NPS (₹):</label>
                <input
                  type="number"
                  max="50000"
                  value={tax80CCD}
                  onChange={(e) => setTax80CCD(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-emerald-400 block mt-0.5">Extra ₹50,000 above 80C</span>
              </div>
            </div>
          </div>

          {/* Tax-Loss Harvesting Engine */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-rose-400" />
                  Tax-Loss Harvesting Opportunities (Section 70 IT Act)
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Book short-term capital losses before the March 31 deadline to directly offset capital gains tax liability.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">
                Potential Tax Shield: ₹{advancedTaxPlan.potentialHarvestTaxSavings.toLocaleString('en-IN')}
              </span>
            </div>

            {advancedTaxPlan.taxLossHarvesting.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950 text-slate-400 text-xs">
                Zero loss positions detected. Your entire equity portfolio is currently profitable.
              </div>
            ) : (
              <div className="space-y-3">
                {advancedTaxPlan.taxLossHarvesting.map((item) => {
                  const isHarvested = harvestedAssetIds.includes(item.assetId);
                  return (
                    <div
                      key={item.assetId}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white">{item.assetName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 font-bold">
                            Unrealized Loss: -₹{item.unrealizedLoss.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 max-w-xl">{item.recommendedAction}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right font-mono text-xs">
                          <span className="text-slate-400 block text-[10px]">Tax Offset Shield</span>
                          <span className="text-emerald-400 font-bold">+₹{item.potentialTaxOffset.toLocaleString('en-IN')}</span>
                        </div>

                        <button
                          onClick={() => handleHarvestLoss(item.assetId)}
                          disabled={isHarvested}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            isHarvested
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950'
                          }`}
                        >
                          {isHarvested ? '✓ Harvested for ITR' : 'Harvest Loss Now'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Advance Tax Statutory Calendar (Sec 234C) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sky-400" />
              Advance Tax Statutory Compliance Schedule (Sections 234B &amp; 234C)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {advancedTaxPlan.advanceTaxSchedule.map((q) => (
                <div
                  key={q.quarter}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 font-mono text-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{q.title}</span>
                    <span className="text-[10px] text-sky-400">{q.dueDate}</span>
                  </div>

                  <div className="space-y-1 text-slate-400 text-[11px]">
                    <div className="flex justify-between">
                      <span>Cumulative Due ({q.statutoryCumulativePercent}%):</span>
                      <span className="text-white font-bold">₹{q.cumulativeTaxDue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TDS Deducted to date:</span>
                      <span className="text-emerald-400">₹{q.taxPaidToDate.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shortfall:</span>
                      <span className={q.shortfallAmount > 0 ? 'text-amber-400' : 'text-slate-500'}>
                        ₹{q.shortfallAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Sec 234C Penalty:</span>
                    <span className={q.interestPenaltySec234C > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {q.interestPenaltySec234C > 0 ? `₹${q.interestPenaltySec234C}` : 'NIL'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Tax Shield Recommendations */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Autonomous AI Tax Blueprint
            </h4>
            <div className="space-y-2">
              {advancedTaxPlan.aiTaxShieldBlueprint.map((point, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span dangerouslySetInnerHTML={{ __html: point.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AI TAX SAVING INTELLIGENCE (Quick Deductions) */}
      {/* ========================================================================= */}
      {mainTab === 'AI_TAX_INTELLIGENCE' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-white text-base">Autonomous Tax Audit Complete</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-semibold">
                    March 31 Deadline Target
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-xl">
                  MoneyShield AI audited your salary CTC, portfolio holdings, and insurance declarations. You have{' '}
                  <strong className="text-emerald-400 font-mono">
                    ₹{taxSuggestions.reduce((sum, s) => sum + s.estimatedTaxSavings, 0).toLocaleString('en-IN')}
                  </strong>{' '}
                  in legally claimable tax refunds and capital loss offsets.
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-mono block">Total Potential Tax Savings</span>
              <span className="text-3xl font-black text-emerald-400 font-mono">
                +₹{taxSuggestions.reduce((sum, s) => sum + s.estimatedTaxSavings, 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-400 block">30% bracket + 4% Health Cess</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {taxSuggestions.map((suggestion) => {
              const isApplied = suggestion.status === 'APPLIED';
              return (
                <div
                  key={suggestion.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                    isApplied
                      ? 'border-emerald-500/40 bg-emerald-950/20'
                      : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-sky-400 border border-slate-700">
                        SECTION {suggestion.section}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        Save ₹{suggestion.estimatedTaxSavings.toLocaleString('en-IN')} in Net Tax
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1.5">{suggestion.title}</h4>
                    <p className="text-xs text-slate-400 mb-3">{suggestion.actionPrompt}</p>

                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-[11px] font-mono text-slate-400">
                        <span>Current Utilized: ₹{suggestion.utilizedDeduction.toLocaleString('en-IN')}</span>
                        <span>Max Cap: ₹{suggestion.deductionLimit.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (suggestion.utilizedDeduction / (suggestion.deductionLimit || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="text-right text-[10px] font-mono text-sky-400">
                        Remaining Headroom: ₹{suggestion.unutilizedHeadroom.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Algorithmic Matches:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestion.recommendedInstruments.map((inst, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-mono"
                          >
                            {inst}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 italic max-w-[200px] truncate">
                      {suggestion.reasoning}
                    </span>
                    <button
                      onClick={() => handleApplySuggestion(suggestion.id)}
                      disabled={isApplied}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isApplied
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          Strategy Deployed
                        </>
                      ) : (
                        <>
                          Deploy Strategy
                          <ArrowRight className="h-3 w-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ALL INSTRUMENTS (FD, Stocks, Mutual Funds, Gold) */}
      {/* ========================================================================= */}
      {mainTab === 'PORTFOLIO_ASSETS' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-[11px] font-mono text-slate-400 block mb-2">Filter Instrument Category:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'ALL', label: 'All Instruments' },
                { id: 'FIXED_DEPOSIT', label: 'Fixed Deposits (FD)' },
                { id: 'STOCKS', label: 'Direct Stocks & Equities' },
                { id: 'MUTUAL_FUNDS', label: 'Mutual Funds (Direct/ELSS)' },
                { id: 'GOLD_SGB', label: 'Gold & SGB' },
                { id: 'PROVIDENT_FUND', label: 'Provident Funds (EPF/PPF)' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setAssetCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    assetCategoryFilter === cat.id
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Instruments Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Instrument &amp; Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Rate / NAV / CAGR</th>
                    <th className="py-3 px-4">Tax Tag</th>
                    <th className="py-3 px-4">LAS Collateral LTV</th>
                    <th className="py-3 px-4 text-right">Invested Value</th>
                    <th className="py-3 px-4 text-right">Current Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAssets.map((asset) => {
                    const isProfit = asset.unrealizedPnl >= 0;
                    return (
                      <tr key={asset.id} className="hover:bg-slate-800/30 transition-all">
                        <td className="py-3 px-4">
                          <div className="font-sans font-bold text-white text-xs flex items-center gap-2">
                            {asset.name}
                            {asset.symbol && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-400 font-mono">
                                {asset.symbol}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            {asset.subCategory} • Liquidity: {asset.liquidityTier}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-800 text-slate-300">
                            {asset.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-400">
                          {asset.interestRate ? `${asset.interestRate}% p.a.` : `${asset.returnsPercentage > 0 ? '+' : ''}${asset.returnsPercentage}%`}
                        </td>
                        <td className="py-3 px-4">
                          {asset.taxTag ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                              {asset.taxTag}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {asset.isPledgedForLoan ? (
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <Lock className="h-3 w-3" /> Pledged (Active LAS)
                            </span>
                          ) : asset.maxLtvPercent ? (
                            <span className="text-emerald-400 font-medium">Up to {asset.maxLtvPercent}% LTV</span>
                          ) : (
                            <span className="text-slate-500">Non-Pledgeable</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300 font-mono">
                          ₹{asset.investedValue.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          <span className="text-white font-bold block">₹{asset.currentValue.toLocaleString('en-IN')}</span>
                          <span className={`text-[10px] ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isProfit ? '+' : ''}₹{asset.unrealizedPnl.toLocaleString('en-IN')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: LOAN AGAINST SECURITIES (LAS) */}
      {/* ========================================================================= */}
      {mainTab === 'LAS_FACILITY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono text-slate-400">Pledged Collateral</span>
                <Lock className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white font-mono block">
                  ₹{totalCollateralPledged.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  In approved Stocks &amp; Direct Mutual Funds
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono text-slate-400">Total Drawing Power</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  50% LTV
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-sky-400 font-mono block">
                  ₹{totalDrawingPower.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Maximum authorized credit limit
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono text-emerald-300 font-semibold">Available Instant Credit Line</span>
                <Zap className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-emerald-300 font-mono block">
                  ₹{availableCreditLine.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-emerald-400/80 mt-0.5 block">
                  Zero paperwork instant liquidity
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono text-slate-400">Interest Saved vs Loans</span>
                <Award className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-amber-400 font-mono block">
                  ₹{totalInterestSavedAnnual.toLocaleString('en-IN')}/yr
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  @ 9.75% vs 16% Personal Loan
                </span>
              </div>
              <button
                onClick={() => setShowPledgeModal(true)}
                className="mt-3 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950"
              >
                + Pledge New Security
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Active Pledged Collateral &amp; Margins</h3>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> All Collateral Protected under Depository Lock
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lasLoans.map((loan) => (
                <div key={loan.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-sky-400 font-bold block">
                        {loan.lenderEntity}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{loan.assetName}</h4>
                      <span className="text-xs text-slate-400 font-mono block">
                        Collateral Value: ₹{loan.collateralValue.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {loan.marginHealth}
                      </span>
                      <span className="text-xs font-mono font-bold text-sky-400 block mt-1">
                        {loan.interestRate}% p.a.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-850 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Drawing Power (Limit):</span>
                      <span className="text-white font-bold">
                        ₹{loan.drawingPower.toLocaleString('en-IN')}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">({loan.approvedLtvPercent}% LTV)</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Utilized (Drawn):</span>
                      <span className="text-rose-400 font-bold">
                        ₹{loan.utilizedAmount.toLocaleString('en-IN')}
                        <span className="text-[10px] text-slate-400 font-normal">Interest: ₹{loan.monthlyInterestDue}/mo</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-1">
                    <span>Collateral Liquidation Buffer:</span>
                    <span className="text-emerald-400 font-bold">&gt; 35% Market Dip</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: OLD VS NEW TAX REGIME SIMULATOR */}
      {/* ========================================================================= */}
      {mainTab === 'TAX_REGIME_CALC' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calculator className="h-4 w-4 text-emerald-400" />
                Income &amp; Deductions Inputs
              </h3>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Gross Annual Income (₹):</label>
                  <input
                    type="number"
                    value={grossSalary}
                    onChange={(e) => setGrossSalary(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Section 80C Deductions (₹):</label>
                  <input
                    type="number"
                    max="150000"
                    value={sec80C}
                    onChange={(e) => setSec80C(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">ELSS, EPF, PPF, Life Insurance</span>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Section 80D Health Insurance (₹):</label>
                  <input
                    type="number"
                    value={sec80D}
                    onChange={(e) => setSec80D(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">HRA Exemption Claimed (₹):</label>
                  <input
                    type="number"
                    value={hra}
                    onChange={(e) => setHra(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className={`p-6 rounded-2xl border transition-all ${
                    regimeComparison.recommendedRegime === 'NEW'
                      ? 'border-emerald-500 bg-emerald-950/20 shadow-xl'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">New Tax Regime</span>
                    {regimeComparison.recommendedRegime === 'NEW' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-black font-mono text-white mb-2">
                    ₹{regimeComparison.newRegime.totalTax.toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-slate-400">
                    Standard Deduction: ₹75,000 • Slabs up to ₹15 Lakhs at lower progressive rates.
                  </p>
                </div>

                <div
                  className={`p-6 rounded-2xl border transition-all ${
                    regimeComparison.recommendedRegime === 'OLD'
                      ? 'border-emerald-500 bg-emerald-950/20 shadow-xl'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Old Tax Regime</span>
                    {regimeComparison.recommendedRegime === 'OLD' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-black font-mono text-white mb-2">
                    ₹{regimeComparison.oldRegime.totalTax.toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-slate-400">
                    With full Chapter VI-A deductions and HRA tax-exempt claim.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-mono font-bold uppercase text-emerald-400 block">
                  AI Regime Optimization Analysis
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  The {regimeComparison.recommendedRegime === 'NEW' ? 'New Tax Regime' : 'Old Tax Regime'} is optimal for your gross salary of ₹{grossSalary.toLocaleString('en-IN')}, delivering an annual net tax saving of ₹{regimeComparison.annualSavings.toLocaleString('en-IN')}.
                </p>
                <div className="pt-2 text-xs font-mono text-slate-400">
                  Effective Tax Rate:{' '}
                  <strong className="text-emerald-400">
                    {regimeComparison.recommendedRegime === 'NEW' ? regimeComparison.newRegime.effectiveRate : regimeComparison.oldRegime.effectiveRate}%
                  </strong>.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Tax Pack Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                Chartered Accountant Tax Filing Dossier
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Formatted tax filing summary ready for upload to Income Tax e-Filing portal, ClearTax, or your Chartered Accountant.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 space-y-2 border border-slate-800 overflow-y-auto max-h-64">
              <div className="text-emerald-400 font-bold border-b border-slate-800 pb-1">
                MONEYSHIELD OS — ITR COMPUTATION SHEET (FY 2024-25)
              </div>
              <div className="flex justify-between">
                <span>Gross Salary CTC:</span>
                <span>₹{advancedTaxPlan.incomeSalary.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Sec 44ADA Freelance Profit:</span>
                <span>₹{advancedTaxPlan.incomeFreelance44ADA.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Capital Gains (STCG+LTCG):</span>
                <span>₹{advancedTaxPlan.incomeCapitalGains.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-white font-bold border-t border-slate-900 pt-1">
                <span>Gross Total Income:</span>
                <span>₹{advancedTaxPlan.grossTotalIncome.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sky-400">
                <span>Optimal Regime:</span>
                <span>{advancedTaxPlan.optimalRegime}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Computed Net Tax:</span>
                <span>₹{advancedTaxPlan.optimalRegime === 'NEW_REGIME' ? advancedTaxPlan.newRegimeTotalTax.toLocaleString('en-IN') : advancedTaxPlan.oldRegimeTotalTax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>TDS Deducted to Date:</span>
                <span>₹{taxTdsPaid.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Harvestable Loss Shield:</span>
                <span>₹{advancedTaxPlan.potentialHarvestTaxSavings.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  soundFx.playBiometricVerified();
                  setShowExportModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-950"
              >
                Download Formatted ITR JSON / CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pledge Asset Modal */}
      {showPledgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-400" />
                Pledge Asset for Instant Credit Line (LAS)
              </h3>
              <button
                onClick={() => setShowPledgeModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Per RBI regulations, direct equities and equity mutual funds are eligible for up to 50% LTV, while fixed deposits reach up to 85% LTV.
            </p>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Select Collateral Asset:</label>
                <select
                  value={selectedPledgeAssetId}
                  onChange={(e) => setSelectedPledgeAssetId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500 text-xs"
                >
                  {assets
                    .filter((a) => !a.isPledgedForLoan && a.maxLtvPercent && a.maxLtvPercent > 0)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Val: ₹{a.currentValue.toLocaleString('en-IN')} • LTV: {a.maxLtvPercent}%)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Amount to Draw (₹):</label>
                <input
                  type="number"
                  min="10000"
                  max="200000"
                  value={pledgeLoanAmount}
                  onChange={(e) => setPledgeLoanAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span>Approved Rate:</span>
                  <span className="text-emerald-400 font-bold">9.75% per annum</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Interest:</span>
                  <span>₹{Math.round((pledgeLoanAmount * 0.0975) / 12)} / month</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowPledgeModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPledge}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950"
              >
                Confirm &amp; Disburse Credit Line
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
