import React, { useState } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  ExternalLink, 
  CheckCircle2, 
  ShieldAlert, 
  Zap, 
  Sparkles, 
  ArrowRight,
  TrendingDown,
  Info,
  Clock,
  HelpCircle,
  FileText,
  Plus,
  PauseCircle,
  PlayCircle,
  Edit3,
  Calendar,
  Lock,
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  BellRing,
  History,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  AutoPayMandate, 
  CreateMandateRequest, 
  ModifyMandateRequest, 
  MandateFrequency 
} from '../types';
import { soundFx } from '../utils/sound';
import { validateRbiMandateRules, computeNextBillingDate } from '../utils/mandates';
import { MockBankingAdapter } from '../adapters/bankingAdapter';

interface AutoPayViewProps {
  mandates: AutoPayMandate[];
  onCancelMandate: (mandateId: string) => void;
  onPauseMandate: (mandateId: string, pausedUntil?: string) => void;
  onResumeMandate: (mandateId: string) => void;
  onModifyMandate: (mandateId: string, updates: ModifyMandateRequest) => void;
  onCreateMandate: (request: CreateMandateRequest) => Promise<void>;
  onNavigate: (tab: string) => void;
}

export const AutoPayView: React.FC<AutoPayViewProps> = ({
  mandates,
  onCancelMandate,
  onPauseMandate,
  onResumeMandate,
  onModifyMandate,
  onCreateMandate,
  onNavigate,
}) => {
  const [selectedMandate, setSelectedMandate] = useState<AutoPayMandate | null>(mandates[0] || null);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'FLAGGED' | 'REVOKED'>('ALL');
  const [activeTabSubView, setActiveTabSubView] = useState<'DETAILS' | 'HISTORY'>('DETAILS');

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);

  // Pause Form State
  const [pauseDuration, setPauseDuration] = useState<'1_MONTH' | '2_MONTHS' | '3_MONTHS' | 'UNTIL_RESUMED'>('1_MONTH');

  // Modify Form State
  const [modAmount, setModAmount] = useState<number>(0);
  const [modMaxCap, setModMaxCap] = useState<number>(0);
  const [modFrequency, setModFrequency] = useState<MandateFrequency>('Monthly');

  // Create Mandate Form State
  const [createServiceName, setCreateServiceName] = useState('');
  const [createMerchantVpa, setCreateMerchantVpa] = useState('');
  const [createPayerVpa, setCreatePayerVpa] = useState('arjun.mehta@okhdfcbank');
  const [createAmount, setCreateAmount] = useState<number>(999);
  const [createMaxCap, setCreateMaxCap] = useState<number>(2000);
  const [createFrequency, setCreateFrequency] = useState<MandateFrequency>('Monthly');
  const [createCategory, setCreateCategory] = useState<CreateMandateRequest['category']>('Entertainment');
  const [createStartDate, setCreateStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [createEndDate, setCreateEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [createAlertHours, setCreateAlertHours] = useState<number>(24);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const filteredMandates = mandates.filter((m) => {
    if (filter === 'ACTIVE') return m.status === 'ACTIVE';
    if (filter === 'PAUSED') return m.status === 'PAUSED';
    if (filter === 'FLAGGED') return m.status === 'FLAGGED' || m.darkPatternsDetected.length > 0;
    if (filter === 'REVOKED') return m.status === 'REVOKED';
    return true;
  });

  const totalMonthlyCommitted = mandates
    .filter((m) => m.status === 'ACTIVE' || m.status === 'FLAGGED')
    .reduce((sum, m) => sum + (m.frequency === 'Monthly' ? m.amount : m.amount / 12), 0);

  const pausedCount = mandates.filter((m) => m.status === 'PAUSED').length;

  const potentialMonthlySavings = mandates
    .filter((m) => m.status !== 'REVOKED' && m.suggestedAlternative)
    .reduce((sum, m) => sum + (m.suggestedAlternative?.monthlySavings || 0), 0);

  // RBI validation for creation
  const rbiCheck = validateRbiMandateRules(createCategory, createAmount, createMaxCap, createAlertHours);

  // Handle Revoke
  const handleRevoke = async (mandate: AutoPayMandate) => {
    setActionLoadingId(mandate.id);
    soundFx.playShieldArmed();
    
    await new Promise((resolve) => setTimeout(resolve, 800));
    onCancelMandate(mandate.id);
    setActionLoadingId(null);
    soundFx.playSavingsFanfare();

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#059669', '#6ee7b7'],
      });
    } catch {
      // fallback
    }
  };

  // Handle Pause
  const handleConfirmPause = async () => {
    if (!selectedMandate) return;
    setActionLoadingId(selectedMandate.id);
    soundFx.playShieldArmed();

    let pauseDateStr = 'Until Resumed';
    if (pauseDuration === '1_MONTH') {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      pauseDateStr = d.toISOString().split('T')[0];
    } else if (pauseDuration === '2_MONTHS') {
      const d = new Date();
      d.setMonth(d.getMonth() + 2);
      pauseDateStr = d.toISOString().split('T')[0];
    } else if (pauseDuration === '3_MONTHS') {
      const d = new Date();
      d.setMonth(d.getMonth() + 3);
      pauseDateStr = d.toISOString().split('T')[0];
    }

    await onPauseMandate(selectedMandate.id, pauseDateStr);
    setActionLoadingId(null);
    setShowPauseModal(false);
    soundFx.playBiometricVerified();
  };

  // Handle Resume
  const handleResume = async (mandate: AutoPayMandate) => {
    setActionLoadingId(mandate.id);
    soundFx.playShieldArmed();

    await onResumeMandate(mandate.id);
    setActionLoadingId(null);
    soundFx.playBiometricVerified();
  };

  // Open Modify Modal
  const openModifyDialog = (mandate: AutoPayMandate) => {
    setModAmount(mandate.amount);
    setModMaxCap(mandate.maxCapAmount || mandate.amount * 1.5);
    setModFrequency(mandate.frequency);
    setShowModifyModal(true);
  };

  // Handle Confirm Modify
  const handleConfirmModify = async () => {
    if (!selectedMandate) return;
    setActionLoadingId(selectedMandate.id);
    soundFx.playShieldArmed();

    await onModifyMandate(selectedMandate.id, {
      amount: modAmount,
      maxCapAmount: modMaxCap,
      frequency: modFrequency,
      nextBillingDate: computeNextBillingDate(modFrequency),
    });

    setActionLoadingId(null);
    setShowModifyModal(false);
    soundFx.playBiometricVerified();
  };

  // Preset Merchant Selection
  const selectMerchantPreset = (name: string, vpa: string, defaultAmt: number, category: CreateMandateRequest['category']) => {
    setCreateServiceName(name);
    setCreateMerchantVpa(vpa);
    setCreateAmount(defaultAmt);
    setCreateMaxCap(Math.round(defaultAmt * 1.3));
    setCreateCategory(category);
  };

  // Handle Submit Create Mandate
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createServiceName.trim() || !createMerchantVpa.trim()) return;

    setIsSubmittingCreate(true);
    soundFx.playShieldArmed();

    await onCreateMandate({
      serviceName: createServiceName,
      merchantVpa: createMerchantVpa,
      payerVpa: createPayerVpa,
      amount: Number(createAmount),
      maxCapAmount: Number(createMaxCap),
      frequency: createFrequency,
      startDate: createStartDate,
      endDate: createEndDate,
      category: createCategory,
      preDebitAlertHours: Number(createAlertHours),
    });

    setIsSubmittingCreate(false);
    setShowCreateModal(false);
    soundFx.playBiometricVerified();

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#10b981', '#3b82f6', '#06b6d4'],
      });
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Active UPI AutoPay</span>
            <span className="font-mono text-emerald-400">NPCI Certified</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {mandates.filter((m) => m.status === 'ACTIVE' || m.status === 'FLAGGED').length} Active
          </p>
          <p className="text-xs text-slate-400 mt-1">
            ₹{Math.round(totalMonthlyCommitted).toLocaleString('en-IN')}/mo committed
          </p>
        </div>

        <div className="rounded-2xl border border-amber-900/40 bg-gradient-to-br from-amber-950/20 to-slate-900 p-5">
          <div className="flex items-center justify-between text-xs text-amber-400 mb-1 font-mono">
            <span>Paused Mandates</span>
            <PauseCircle className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-amber-300 font-mono">
            {pausedCount} Paused
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Debits frozen at clearinghouse
          </p>
        </div>

        <div className="rounded-2xl border border-rose-900/40 bg-gradient-to-br from-rose-950/20 to-slate-900 p-5">
          <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1 font-mono">
            <ShieldAlert className="h-4 w-4" />
            <span>Dark Patterns</span>
          </div>
          <p className="text-2xl font-bold text-rose-300 font-mono">
            {mandates.filter((m) => m.status !== 'REVOKED' && m.darkPatternsDetected.length > 0).length} Traps
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Sneaky fees &amp; roach motels
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-900/40 bg-gradient-to-br from-emerald-950/20 to-slate-900 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-mono">
            <span>Available Monthly Savings</span>
            <TrendingDown className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            ₹{Math.round(potentialMonthlySavings).toLocaleString('en-IN')}/mo
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-2 w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 shadow-sm shadow-emerald-950"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Set Up UPI 2.0 Mandate</span>
          </button>
        </div>
      </div>

      {/* Main Mandates & Management Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of Mandates (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between pb-2 gap-2">
            <h3 className="font-bold text-white text-base">Mandates &amp; AutoPay Vault</h3>
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs overflow-x-auto">
              {(['ALL', 'ACTIVE', 'PAUSED', 'FLAGGED', 'REVOKED'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    filter === mode
                      ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 max-h-[660px] overflow-y-auto pr-1">
            {filteredMandates.map((mandate) => {
              const isSelected = selectedMandate?.id === mandate.id;
              const hasDarkPattern = mandate.darkPatternsDetected.length > 0;
              const isRevoked = mandate.status === 'REVOKED';
              const isPaused = mandate.status === 'PAUSED';

              return (
                <div
                  key={mandate.id}
                  onClick={() => setSelectedMandate(mandate)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500/60 bg-slate-800/90 shadow-md shadow-emerald-950/20'
                      : isPaused
                      ? 'border-amber-900/40 bg-slate-900 hover:bg-slate-850'
                      : hasDarkPattern && !isRevoked
                      ? 'border-rose-900/40 bg-slate-900 hover:bg-slate-850'
                      : 'border-slate-800 bg-slate-900 hover:bg-slate-850'
                  } ${isRevoked ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{mandate.logo}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-100 text-sm">{mandate.serviceName}</h4>
                          {isRevoked ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
                              REVOKED
                            </span>
                          ) : isPaused ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                              PAUSED
                            </span>
                          ) : hasDarkPattern ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                              TRAP DETECTED
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {mandate.merchantVpa} • {mandate.mandateType}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold font-mono text-white text-sm">
                        ₹{mandate.amount.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-slate-500 capitalize">{mandate.frequency}</p>
                    </div>
                  </div>

                  {/* UMN Snippet & Status */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[11px] truncate max-w-[200px]">
                      {mandate.umn || 'UMN-NPCI-UPI-2026'}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Cap: <strong className="text-slate-200 font-mono">₹{(mandate.maxCapAmount || mandate.amount).toLocaleString('en-IN')}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Mandate Deep Inspector, Actions & History (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedMandate ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 rounded-xl bg-slate-800 border border-slate-700">
                    {selectedMandate.logo}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white">{selectedMandate.serviceName}</h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {selectedMandate.mandateType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      UMN: <span className="text-emerald-400">{selectedMandate.umn || 'UMN-2026-NPCI-GEN'}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    ₹{selectedMandate.amount.toLocaleString('en-IN')}{' '}
                    <span className="text-xs text-slate-400 font-normal">/{selectedMandate.frequency.toLowerCase()}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                    selectedMandate.status === 'REVOKED'
                      ? 'bg-slate-800 text-slate-400'
                      : selectedMandate.status === 'PAUSED'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    Status: {selectedMandate.status} {selectedMandate.pausedUntil ? `(${selectedMandate.pausedUntil})` : ''}
                  </span>
                </div>
              </div>

              {/* Sub-tab navigation: Details vs Pre-debit Execution History */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setActiveTabSubView('DETAILS')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    activeTabSubView === 'DETAILS'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Mandate Controls &amp; Rules
                </button>
                <button
                  onClick={() => setActiveTabSubView('HISTORY')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    activeTabSubView === 'HISTORY'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <History className="h-3.5 w-3.5" />
                  <span>Execution &amp; Pre-Debit Audit</span>
                </button>
              </div>

              {activeTabSubView === 'DETAILS' ? (
                <div className="space-y-5">
                  {/* RBI Rule & Parameter Matrix */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Maximum Authorized Cap:</span>
                      <span className="text-white font-bold">
                        ₹{(selectedMandate.maxCapAmount || selectedMandate.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Payer VPA (Debited Account):</span>
                      <span className="text-slate-200">{selectedMandate.payerVpa || 'arjun.mehta@okhdfcbank'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Merchant Beneficiary VPA:</span>
                      <span className="text-slate-200">{selectedMandate.merchantVpa}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Next Billing Date:</span>
                      <span className="text-emerald-400">{selectedMandate.nextBillingDate}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>RBI Pre-Debit Alert Window:</span>
                      <span className="text-cyan-400">{selectedMandate.preDebitAlertHours || 24} Hours Prior (Mandatory)</span>
                    </div>
                  </div>

                  {/* Dark Pattern Analysis Section */}
                  {selectedMandate.darkPatternsDetected.length > 0 && selectedMandate.status !== 'REVOKED' && (
                    <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                        <ShieldAlert className="h-4 w-4" />
                        <span>Dark Pattern Heuristic Analysis</span>
                      </div>
                      {selectedMandate.darkPatternsDetected.map((dp, idx) => (
                        <div key={idx} className="bg-slate-900/80 p-3 rounded-lg border border-rose-900/30 text-xs">
                          <div className="flex items-center justify-between font-mono text-rose-300 font-semibold mb-1">
                            <span className="uppercase">{dp.type.replace('_', ' ')}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/50 text-rose-200">
                              {dp.severity} SEVERITY
                            </span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">{dp.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Optimization / Alternative Recommendation */}
                  {selectedMandate.suggestedAlternative && selectedMandate.status !== 'REVOKED' && (
                    <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4">
                      <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
                        <Sparkles className="h-4 w-4" />
                        <span>Algorithmic Optimization Recommendation</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-white text-sm">
                            Switch to: {selectedMandate.suggestedAlternative.name}
                          </p>
                          <p className="text-xs text-slate-300 mt-0.5">
                            {selectedMandate.suggestedAlternative.reason}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="block text-emerald-400 font-bold font-mono text-lg">
                            +₹{selectedMandate.suggestedAlternative.monthlySavings}/mo
                          </span>
                          <span className="text-[11px] text-slate-500">Immediate Savings</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mandate Management Action Bar (Pause / Resume / Modify / Cancel) */}
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <span className="text-xs font-semibold text-slate-300 uppercase font-mono tracking-wider block">
                      UPI 2.0 Clearinghouse Management Actions:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Pause / Resume Button */}
                      {selectedMandate.status === 'PAUSED' ? (
                        <button
                          onClick={() => handleResume(selectedMandate)}
                          disabled={actionLoadingId === selectedMandate.id}
                          className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <PlayCircle className="h-4 w-4" />
                          <span>{actionLoadingId === selectedMandate.id ? 'Resuming...' : 'Resume AutoPay'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowPauseModal(true)}
                          disabled={selectedMandate.status === 'REVOKED' || actionLoadingId === selectedMandate.id}
                          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 disabled:opacity-50 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                        >
                          <PauseCircle className="h-4 w-4 text-amber-400" />
                          <span>Pause Mandate</span>
                        </button>
                      )}

                      {/* Modify Button */}
                      <button
                        onClick={() => openModifyDialog(selectedMandate)}
                        disabled={selectedMandate.status === 'REVOKED' || selectedMandate.status === 'PAUSED'}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 disabled:opacity-50 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                      >
                        <Edit3 className="h-4 w-4 text-cyan-400" />
                        <span>Modify Limits</span>
                      </button>

                      {/* Revoke Button */}
                      {selectedMandate.status !== 'REVOKED' ? (
                        <button
                          onClick={() => handleRevoke(selectedMandate)}
                          disabled={actionLoadingId === selectedMandate.id}
                          className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/40 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>
                            {actionLoadingId === selectedMandate.id ? 'Revoking...' : 'Revoke Mandate'}
                          </span>
                        </button>
                      ) : (
                        <div className="py-2 px-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 font-mono text-xs flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span>Revoked at NPCI</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Execution & Pre-debit Notification History Tab */
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-cyan-400 font-mono">
                      <BellRing className="h-3.5 w-3.5" />
                      <span>RBI Mandate Pre-Debit Log &amp; Settlement Ledger</span>
                    </span>
                    <span className="font-mono text-[11px]">Audit trail: 100% Verified</span>
                  </div>

                  <div className="space-y-2.5">
                    {selectedMandate.history && selectedMandate.history.length > 0 ? (
                      selectedMandate.history.map((log) => (
                        <div
                          key={log.id}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                log.status === 'SUCCESS'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : log.status === 'PRE_DEBIT_NOTIFIED'
                                  ? 'bg-cyan-500/20 text-cyan-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}>
                                {log.status}
                              </span>
                              <span className="font-mono text-slate-300">{log.date}</span>
                            </div>
                            <p className="text-slate-400 text-[11px] mt-1 font-mono">
                              NPCI Ref: {log.npciRefNumber}
                            </p>
                            {log.note && (
                              <p className="text-slate-500 text-[11px] mt-0.5 italic">{log.note}</p>
                            )}
                          </div>

                          <div className="text-right font-mono font-bold text-white">
                            ₹{log.amount.toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        No previous debit executions recorded for this mandate.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              Select a mandate from the left to inspect parameters, modify limits, or pause auto-debit.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Create UPI 2.0 AutoPay Mandate */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Set Up UPI 2.0 AutoPay Mandate"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Register UPI 2.0 AutoPay Mandate</h3>
                  <p className="text-xs text-slate-400 font-mono">NPCI UPI e-Mandate Framework with RBI AFA Gate</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Merchant Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Quick Verified Merchants:</span>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { name: 'Tata Power Electricity', vpa: 'tatapower.mumbai@sbi', amt: 3800, cat: 'Utilities' as const },
                  { name: 'Zerodha Coin SIP', vpa: 'zerodha.sip@hdfcbank', amt: 10000, cat: 'Investment' as const },
                  { name: 'Spotify Premium Family', vpa: 'spotify.india@icici', amt: 179, cat: 'Entertainment' as const },
                  { name: 'HDFC Life Super Shield', vpa: 'hdfclife.mandate@hdfcbank', amt: 18500, cat: 'Insurance' as const },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectMerchantPreset(item.name, item.vpa, item.amt, item.cat)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-[11px] font-mono"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmitCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Service / Merchant Name:</label>
                  <input
                    type="text"
                    required
                    value={createServiceName}
                    onChange={(e) => setCreateServiceName(e.target.value)}
                    placeholder="e.g. Tata Power / Spotify"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Merchant UPI VPA:</label>
                  <input
                    type="text"
                    required
                    value={createMerchantVpa}
                    onChange={(e) => setCreateMerchantVpa(e.target.value)}
                    placeholder="e.g. merch.name@okhdfcbank"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Recurring Amount (₹):</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={createAmount}
                    onChange={(e) => setCreateAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Maximum Authorized Cap (₹):</label>
                  <input
                    type="number"
                    min={createAmount}
                    required
                    value={createMaxCap}
                    onChange={(e) => setCreateMaxCap(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Debit Frequency:</label>
                  <select
                    value={createFrequency}
                    onChange={(e) => setCreateFrequency(e.target.value as MandateFrequency)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="As-Presented">As-Presented</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Category:</label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value as CreateMandateRequest['category'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Entertainment">Entertainment</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Investment">Investment (SIP)</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Software">Software &amp; SaaS</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Payer VPA Account:</label>
                  <input
                    type="text"
                    required
                    value={createPayerVpa}
                    onChange={(e) => setCreatePayerVpa(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Pre-Debit Alert Notice:</label>
                  <select
                    value={createAlertHours}
                    onChange={(e) => setCreateAlertHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="24">24 Hours (RBI Standard)</option>
                    <option value="48">48 Hours (Recommended)</option>
                    <option value="72">72 Hours Prior</option>
                  </select>
                </div>
              </div>

              {/* RBI Compliance & Exemption Banner */}
              <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                rbiCheck.isCompliant
                  ? 'bg-emerald-950/20 border-emerald-900/50 text-slate-300'
                  : 'bg-amber-950/20 border-amber-900/50 text-amber-200'
              }`}>
                <div className="flex items-center gap-1.5 font-bold font-mono text-[11px]">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>RBI AutoPay Compliance Engine:</span>
                </div>
                {rbiCheck.requiresPerDebitAfa ? (
                  <p className="text-[11px] text-amber-300 leading-relaxed">
                    Note: Maximum cap ₹{createMaxCap.toLocaleString('en-IN')} exceeds the ₹{rbiCheck.maxPermissibleLimit.toLocaleString('en-IN')} AFA exemption threshold for this category. Subsequent debits above ₹{rbiCheck.maxPermissibleLimit.toLocaleString('en-IN')} will trigger an additional OTP verification step.
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-400 leading-relaxed">
                    Compliant: Mandate within ₹{rbiCheck.maxPermissibleLimit.toLocaleString('en-IN')} automated recurring limit. Pre-debit alert set to {createAlertHours} hours.
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium text-xs hover:bg-slate-750"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate || !rbiCheck.isCompliant}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>{isSubmittingCreate ? 'Registering with NPCI...' : 'Authenticate & Create Mandate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Pause Mandate */}
      {showPauseModal && selectedMandate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PauseCircle className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Pause UPI Mandate</h3>
              </div>
              <button
                onClick={() => setShowPauseModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Pausing will instruct the NPCI clearinghouse to decline recurring auto-debit requests for <strong className="text-white">{selectedMandate.serviceName}</strong> without forfeiting your registered mandate handle.
            </p>

            <div className="space-y-2 text-xs">
              <label className="text-slate-400 font-medium block">Select Pause Duration:</label>
              {[
                { id: '1_MONTH', label: 'Pause for 1 Month' },
                { id: '2_MONTHS', label: 'Pause for 2 Months' },
                { id: '3_MONTHS', label: 'Pause for 3 Months' },
                { id: 'UNTIL_RESUMED', label: 'Pause Indefinitely Until Resumed' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                    pauseDuration === opt.id
                      ? 'border-amber-500/50 bg-amber-950/20 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-300'
                  }`}
                >
                  <span>{opt.label}</span>
                  <input
                    type="radio"
                    name="pauseDur"
                    checked={pauseDuration === opt.id}
                    onChange={() => setPauseDuration(opt.id as typeof pauseDuration)}
                    className="accent-amber-500"
                  />
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowPauseModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPause}
                disabled={actionLoadingId === selectedMandate.id}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-950"
              >
                {actionLoadingId === selectedMandate.id ? 'Submitting to NPCI...' : 'Confirm Pause'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Modify Mandate Limits */}
      {showModifyModal && selectedMandate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Modify Mandate Limits</h3>
              </div>
              <button
                onClick={() => setShowModifyModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Adjust recurring parameters for <strong className="text-white">{selectedMandate.serviceName}</strong>. Under RBI guidelines, modifying max cap limits requires AFA authentication.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Recurring Amount (₹):</label>
                <input
                  type="number"
                  min="1"
                  value={modAmount}
                  onChange={(e) => setModAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Maximum Authorized Cap (₹):</label>
                <input
                  type="number"
                  min={modAmount}
                  value={modMaxCap}
                  onChange={(e) => setModMaxCap(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Debit Frequency:</label>
                <select
                  value={modFrequency}
                  onChange={(e) => setModFrequency(e.target.value as MandateFrequency)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="Weekly">Weekly</option>
                  <option value="As-Presented">As-Presented</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowModifyModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmModify}
                disabled={actionLoadingId === selectedMandate.id}
                className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950"
              >
                {actionLoadingId === selectedMandate.id ? 'Updating NPCI...' : 'Verify & Modify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
