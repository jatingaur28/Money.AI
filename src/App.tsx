/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { CommandMenu } from './components/CommandMenu';
import { DashboardView } from './components/DashboardView';
import { AutoPayView } from './components/AutoPayView';
import { FraudShieldView } from './components/FraudShieldView';
import { TransactionsView } from './components/TransactionsView';
import { AIAssistantView } from './components/AIAssistantView';
import { PortfolioAndTaxView } from './components/PortfolioAndTaxView';
import { MultiPlayerView } from './components/MultiPlayerView';
import { PrivacyLedgerModal } from './components/PrivacyLedgerModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { PanicModal } from './components/PanicModal';

import {
  INITIAL_USER,
  INITIAL_TRANSACTIONS,
  INITIAL_MANDATES,
  INITIAL_THREATS,
  INITIAL_ASSETS,
  INITIAL_LOANS_AGAINST_SECURITIES,
  INITIAL_LIABILITIES,
  INITIAL_CONSENT_RECORDS,
} from './data/seedData';
import { 
  UserProfile, 
  Transaction, 
  AutoPayMandate, 
  ThreatItem, 
  ConsentRecord, 
  LanguageCode, 
  UserPersona,
  CreateMandateRequest,
  ModifyMandateRequest,
  InvestmentAsset,
  LoanAgainstSecurities
} from './types';
import { soundFx } from './utils/sound';
import { MockBankingAdapter } from './adapters/bankingAdapter';

export default function App() {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [mandates, setMandates] = useState<AutoPayMandate[]>(INITIAL_MANDATES);
  const [threats, setThreats] = useState<ThreatItem[]>(INITIAL_THREATS);
  const [assets, setAssets] = useState<InvestmentAsset[]>(INITIAL_ASSETS);
  const [lasLoans, setLasLoans] = useState<LoanAgainstSecurities[]>(INITIAL_LOANS_AGAINST_SECURITIES);
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>(INITIAL_CONSENT_RECORDS);

  // Modal dialog states
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isPrivacyLedgerOpen, setIsPrivacyLedgerOpen] = useState(false);
  const [isPanicOpen, setIsPanicOpen] = useState(false);

  const bankingAdapter = new MockBankingAdapter();

  // Action: Cancel Mandate
  const handleCancelMandate = (mandateId: string) => {
    setMandates((prev) =>
      prev.map((m) =>
        m.id === mandateId
          ? {
              ...m,
              status: 'REVOKED' as const,
              darkPatternsDetected: [],
              riskScore: 0,
            }
          : m
      )
    );
    // Positively bump health score
    setUser((prev) => ({
      ...prev,
      healthScore: Math.min(1000, prev.healthScore + 35),
    }));
  };

  // Action: Pause Mandate
  const handlePauseMandate = async (mandateId: string, pausedUntil?: string) => {
    await bankingAdapter.pauseMandate(mandateId, pausedUntil);
    setMandates((prev) =>
      prev.map((m) =>
        m.id === mandateId
          ? {
              ...m,
              status: 'PAUSED' as const,
              pausedUntil: pausedUntil || 'Until Resumed',
            }
          : m
      )
    );
  };

  // Action: Resume Mandate
  const handleResumeMandate = async (mandateId: string) => {
    await bankingAdapter.resumeMandate(mandateId);
    setMandates((prev) =>
      prev.map((m) =>
        m.id === mandateId
          ? {
              ...m,
              status: 'ACTIVE' as const,
              pausedUntil: undefined,
            }
          : m
      )
    );
  };

  // Action: Modify Mandate
  const handleModifyMandate = async (mandateId: string, updates: ModifyMandateRequest) => {
    await bankingAdapter.modifyMandate(mandateId, updates);
    setMandates((prev) =>
      prev.map((m) =>
        m.id === mandateId
          ? {
              ...m,
              amount: updates.amount !== undefined ? updates.amount : m.amount,
              maxCapAmount: updates.maxCapAmount !== undefined ? updates.maxCapAmount : m.maxCapAmount,
              frequency: updates.frequency || m.frequency,
              nextBillingDate: updates.nextBillingDate || m.nextBillingDate,
            }
          : m
      )
    );
  };

  // Action: Create Mandate
  const handleCreateMandate = async (request: CreateMandateRequest) => {
    const res = await bankingAdapter.createMandate(request);
    if (res.success && res.mandate) {
      setMandates((prev) => [res.mandate, ...prev]);
    }
  };

  // Action: Add Transaction
  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Action: Add Threat
  const handleAddThreat = (newThreat: ThreatItem) => {
    setThreats((prev) => [newThreat, ...prev]);
  };

  // Action: Revoke DPDP Consent
  const handleRevokeConsent = (consentId: string) => {
    setConsentRecords((prev) =>
      prev.map((cr) => (cr.id === consentId ? { ...cr, status: 'REVOKED' as const } : cr))
    );
  };

  // Action: Right to be Forgotten (Purge all user cached data)
  const handlePurgeAllData = () => {
    setTransactions([]);
    setMandates([]);
    setConsentRecords([]);
    setUser((prev) => ({
      ...prev,
      fullName: 'Anonymous User',
      email: 'purged@moneyshield.internal',
      panMasked: '••••••••••',
      healthScore: 500,
      dataSovereignty: {
        ...prev.dataSovereignty,
        accountAggregatorLinked: false,
      },
    }));
  };

  // Action: Toggle Passkey
  const handleTogglePasskey = () => {
    setUser((prev) => ({
      ...prev,
      hasPasskey: !prev.hasPasskey,
    }));
  };

  // Action: Change Language
  const handleChangeLanguage = (lang: LanguageCode) => {
    soundFx.playShieldArmed();
    setUser((prev) => ({
      ...prev,
      preferredLanguage: lang,
    }));
  };

  // Action: Change Persona
  const handleChangePersona = (persona: UserPersona) => {
    soundFx.playShieldArmed();
    let income = 245000;
    if (persona === 'freelancer') income = 180000;
    else if (persona === 'student') income = 25000;
    else if (persona === 'smb') income = 650000;

    setUser((prev) => ({
      ...prev,
      persona,
      monthlyIncome: income,
    }));
  };

  // Action: Agent Tool Execution
  const handleExecuteTool = (toolName: string, args: Record<string, unknown>) => {
    if (toolName === 'queue_mandate_cancellation') {
      const mandateId = (args.mandateId as string) || 'man-netflix-01';
      handleCancelMandate(mandateId);
    } else if (
      toolName === 'calculate_tax_regime_comparison' ||
      toolName === 'generate_advanced_tax_plan' ||
      toolName === 'design_portfolio_allocation'
    ) {
      setActiveTab('yield');
    } else if (toolName === 'query_transactions') {
      setActiveTab('transactions');
    }
  };

  // Behavioral Nudge Application
  const handleApplyNudge = (nudgeId: string) => {
    soundFx.playSavingsFanfare();
    if (nudgeId === 'weekend-delivery-lock') {
      setUser((prev) => ({
        ...prev,
        healthScore: Math.min(1000, prev.healthScore + 20),
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col vault-grid-bg">
      {/* Top Navigation */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCommand={() => setIsCommandOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onOpenPrivacyLedger={() => setIsPrivacyLedgerOpen(true)}
        onOpenPanic={() => setIsPanicOpen(true)}
        onTogglePasskey={handleTogglePasskey}
        onChangeLanguage={handleChangeLanguage}
        onChangePersona={handleChangePersona}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            user={user}
            transactions={transactions}
            mandates={mandates}
            threats={threats}
            assets={assets}
            liabilities={INITIAL_LIABILITIES}
            onNavigate={(tab) => setActiveTab(tab)}
            onApplyNudge={handleApplyNudge}
          />
        )}

        {activeTab === 'autopay' && (
          <AutoPayView
            mandates={mandates}
            onCancelMandate={handleCancelMandate}
            onPauseMandate={handlePauseMandate}
            onResumeMandate={handleResumeMandate}
            onModifyMandate={handleModifyMandate}
            onCreateMandate={handleCreateMandate}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'fraud_shield' && (
          <FraudShieldView
            threats={threats}
            onAddThreat={handleAddThreat}
            onOpenPanic={() => setIsPanicOpen(true)}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
          />
        )}

        {activeTab === 'agent' && (
          <AIAssistantView
            user={user}
            onExecuteTool={handleExecuteTool}
          />
        )}

        {activeTab === 'yield' && (
          <PortfolioAndTaxView
            user={user}
            assets={assets}
            lasLoans={lasLoans}
            onAddAsset={(newAsset) => setAssets((prev) => [newAsset, ...prev])}
          />
        )}

        {activeTab === 'multiplayer' && (
          <MultiPlayerView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-slate-400">MONEYSHIELD OS</span>
            <span>•</span>
            <span>Zero-Trust Client Enclave (AES-256)</span>
            <span>•</span>
            <span className="text-emerald-400">India Stack AA Linked</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsPrivacyLedgerOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              DPDP Act 2023 Consent Ledger
            </button>
            <button
              onClick={() => setIsArchitectureOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-mono transition-colors"
            >
              System Specs &amp; Drizzle Schema
            </button>
            <button
              onClick={() => setIsPanicOpen(true)}
              className="text-rose-400 hover:text-rose-300 font-mono transition-colors"
            >
              1930 Cybercrime Helpline
            </button>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <CommandMenu
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onTriggerAction={(actionId) => {
          if (actionId === 'focus-detonator') setActiveTab('fraud_shield');
          else if (actionId === 'trigger-upload') setActiveTab('transactions');
        }}
      />

      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      <PrivacyLedgerModal
        isOpen={isPrivacyLedgerOpen}
        onClose={() => setIsPrivacyLedgerOpen(false)}
        consentRecords={consentRecords}
        onRevokeConsent={handleRevokeConsent}
        onPurgeAllData={handlePurgeAllData}
      />

      <PanicModal
        isOpen={isPanicOpen}
        onClose={() => setIsPanicOpen(false)}
      />
    </div>
  );
}
