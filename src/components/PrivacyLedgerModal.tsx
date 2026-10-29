import React, { useState } from 'react';
import { 
  FileLock2, 
  Trash2, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Database, 
  KeyRound, 
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { ConsentRecord } from '../types';
import { soundFx } from '../utils/sound';

interface PrivacyLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  consentRecords: ConsentRecord[];
  onRevokeConsent: (consentId: string) => void;
  onPurgeAllData: () => void;
}

export const PrivacyLedgerModal: React.FC<PrivacyLedgerModalProps> = ({
  isOpen,
  onClose,
  consentRecords,
  onRevokeConsent,
  onPurgeAllData,
}) => {
  const [isPurging, setIsPurging] = useState(false);
  const [purgedComplete, setPurgedComplete] = useState(false);

  if (!isOpen) return null;

  const handlePurge = async () => {
    setIsPurging(true);
    soundFx.playThreatWarning();

    await new Promise((resolve) => setTimeout(resolve, 900));
    onPurgeAllData();
    setIsPurging(false);
    setPurgedComplete(true);
    soundFx.playBiometricVerified();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 shadow-emerald-950/20 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="MoneyShield DPDP Privacy Ledger"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <FileLock2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Privacy Ledger &amp; Data Sovereignty Vault</h3>
              <p className="text-xs text-slate-400 font-mono">India DPDP Act 2023 &amp; RBI Account Aggregator Master Directions</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* DPDP Status Box */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-emerald-400" />
              <span>Cryptographic Storage Mode:</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold">AES-256-GCM (Client-Enclave)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Database className="h-4 w-4 text-cyan-400" />
              <span>Third-Party Cloud Egress:</span>
            </span>
            <span className="font-mono text-cyan-400 font-bold">Zero (Air-Gapped Heuristics)</span>
          </div>
        </div>

        {/* Consent Records Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Active DPDP / RBI Consent Manifests
          </h4>

          <div className="space-y-2 text-xs">
            {consentRecords.map((cr) => (
              <div
                key={cr.id}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{cr.purpose}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      cr.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {cr.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{cr.dataCategory}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Basis: {cr.regulatoryBasis} • Valid until: {cr.expiresOn}
                  </p>
                </div>

                {cr.status === 'ACTIVE' && (
                  <button
                    onClick={() => {
                      soundFx.playShieldArmed();
                      onRevokeConsent(cr.id);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30 transition-colors"
                  >
                    Revoke Consent
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right to be Forgotten Section */}
        <div className="p-4 rounded-xl border border-rose-900/50 bg-rose-950/20 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider font-mono">
            <AlertTriangle className="h-4 w-4" />
            <span>Right to be Forgotten (DPDP Section 12)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Exercising this right triggers a zero-fill cryptographic purge of all cached bank statements, user profiles, and heuristic telemetry from this browser session.
          </p>

          <button
            onClick={handlePurge}
            disabled={isPurging}
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white font-bold text-xs shadow-lg shadow-rose-950 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isPurging ? 'Purging Local Enclave...' : 'Purge All Data & Reset Vault'}</span>
          </button>
        </div>

        {purgedComplete && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center font-mono">
            All user telemetry, tokens, and bank statement caches successfully purged.
          </div>
        )}
      </div>
    </div>
  );
};
