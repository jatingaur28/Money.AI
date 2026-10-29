import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Fingerprint, 
  Globe, 
  Terminal, 
  Search, 
  FileLock2, 
  PhoneCall, 
  Volume2,
  CheckCircle2,
  Users
} from 'lucide-react';
import { UserProfile, LanguageCode, UserPersona } from '../types';
import { soundFx } from '../utils/sound';

interface NavbarProps {
  user: UserProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCommand: () => void;
  onOpenArchitecture: () => void;
  onOpenPrivacyLedger: () => void;
  onOpenPanic: () => void;
  onTogglePasskey: () => void;
  onChangeLanguage: (lang: LanguageCode) => void;
  onChangePersona: (persona: UserPersona) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenCommand,
  onOpenArchitecture,
  onOpenPrivacyLedger,
  onOpenPanic,
  onTogglePasskey,
  onChangeLanguage,
  onChangePersona,
}) => {
  const navTabs = [
    { id: 'dashboard', label: 'Omni-Vault' },
    { id: 'autopay', label: 'AutoPay & Dark Patterns' },
    { id: 'fraud_shield', label: 'Zero-Day Shield' },
    { id: 'transactions', label: 'Transactions & Tax' },
    { id: 'agent', label: 'AI Guardian' },
    { id: 'yield', label: 'Portfolio, LAS & AI Tax' },
    { id: 'multiplayer', label: 'Household & SMB' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      {/* Top Utility Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900 px-4 py-1.5 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="tracking-wider uppercase text-[10px]">Zero-Trust Enclave Active</span>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
            <FileLock2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>DPDP Act 2023 Compliant</span>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          <div className="hidden md:flex items-center gap-1 text-slate-300">
            <span>RBI Account Aggregator:</span>
            <span className="text-emerald-400 font-semibold">OneMoney / Setu Linked</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Persona Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5">
            <Users className="h-3 w-3 text-slate-400" />
            <select
              aria-label="User Persona"
              value={user.persona}
              onChange={(e) => onChangePersona(e.target.value as UserPersona)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="salaried" className="bg-slate-900">Persona: Salaried (IT/Corp)</option>
              <option value="freelancer" className="bg-slate-900">Persona: Freelancer (44ADA)</option>
              <option value="smb" className="bg-slate-900">Persona: SMB / Startup</option>
              <option value="student" className="bg-slate-900">Persona: Student / Gen-Z</option>
            </select>
          </div>

          {/* Vernacular Language Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5">
            <Globe className="h-3 w-3 text-slate-400" />
            <select
              aria-label="Language Selector"
              value={user.preferredLanguage}
              onChange={(e) => onChangeLanguage(e.target.value as LanguageCode)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="en" className="bg-slate-900">English</option>
              <option value="hi" className="bg-slate-900">हिन्दी (Hindi)</option>
              <option value="mr" className="bg-slate-900">मराठी (Marathi)</option>
              <option value="ta" className="bg-slate-900">தமிழ் (Tamil)</option>
              <option value="te" className="bg-slate-900">తెలుగు (Telugu)</option>
            </select>
          </div>

          {/* Passkey Biometric Enclave Status */}
          <button
            onClick={() => {
              soundFx.playBiometricVerified();
              onTogglePasskey();
            }}
            aria-label="Toggle Passkey Biometric Enclave"
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs transition-colors ${
              user.hasPasskey
                ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300'
                : 'bg-amber-950/60 border-amber-700/50 text-amber-300'
            }`}
          >
            <Fingerprint className="h-3 w-3" />
            <span>{user.hasPasskey ? 'Passkey Ready' : 'Passkey Off'}</span>
          </button>

          {/* 1-Tap Emergency Panic Button */}
          <button
            onClick={() => {
              soundFx.playThreatWarning();
              onOpenPanic();
            }}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-rose-600/90 hover:bg-rose-600 text-white font-medium text-xs shadow-sm shadow-rose-950 transition-transform active:scale-95"
            aria-label="Emergency 1-Tap Cybercrime Response Center"
          >
            <PhoneCall className="h-3 w-3 animate-pulse" />
            <span>PANIC 1930</span>
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="flex items-center justify-between gap-4 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="h-full w-full rounded-[10px] bg-slate-950 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-base sm:text-lg bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent font-mono">
                  MONEYSHIELD<span className="text-emerald-400">.OS</span>
                </span>
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 font-mono">
                  v2.8-PROD
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Zero-Trust Financial Guardian & Autonomous Protector</p>
            </div>
          </div>
        </div>

        {/* Global Nav Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-xl p-1">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundFx.playShieldArmed();
                  setActiveTab(tab.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Spotlight Search Button */}
          <button
            onClick={onOpenCommand}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            title="Press Cmd+K or Ctrl+K"
          >
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden md:inline">Command Spotlight</span>
            <kbd className="hidden sm:inline rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700">
              ⌘K
            </kbd>
          </button>

          {/* Privacy Ledger Button */}
          <button
            onClick={onOpenPrivacyLedger}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
            title="DPDP Act Privacy Ledger & Data Sovereignty"
          >
            <FileLock2 className="h-3.5 w-3.5 text-teal-400" />
            <span className="hidden md:inline">Privacy Vault</span>
          </button>

          {/* Architecture Spec Button */}
          <button
            onClick={onOpenArchitecture}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/40 text-xs text-emerald-300 font-mono transition-colors"
            title="Inspect Mermaid Architecture, Drizzle Schema, and Setup Scripts"
          >
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">&lt;Architecture /&gt;</span>
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Subnav */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-900 px-3 py-1.5 gap-1.5 no-scrollbar">
        {navTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundFx.playShieldArmed();
                setActiveTab(tab.id);
              }}
              className={`whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
