import React, { useState } from 'react';
import { 
  PhoneCall, 
  ShieldAlert, 
  Lock, 
  FileText, 
  X, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  AlertOctagon
} from 'lucide-react';
import { soundFx } from '../utils/sound';

interface PanicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PanicModal: React.FC<PanicModalProps> = ({ isOpen, onClose }) => {
  const [cardsFrozen, setCardsFrozen] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  if (!isOpen) return null;

  const complaintDraft = `FORMAL CYBER FRAUD COMPLAINT (FOR CYBERCRIME.GOV.IN / 1930 HELPLINE)
--------------------------------------------------------------------------------
Complainant: Arjun Mehta | Phone: +91 98201 44819
Date of Incident: ${new Date().toLocaleDateString('en-IN')}
Incident Type: Impersonation / Deceptive VPA Phishing / Extortion Script
Affected Account: HDFC Bank •••• 4892
Target VPA / Fraud Identifier: swiggy.support.refund99@okhdfcbank
Incident Description: Complainant was targeted by an unauthorized social engineering communication masquerading as an electricity disconnection / brand refund protocol. An unauthorized payment debit request was broadcast.
Remedial Action Taken: MoneyShield OS Zero-Trust Enclave isolated the payload, revoked connected UPI mandates, and generated this forensic audit trail.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(complaintDraft);
    setCopiedDraft(true);
    soundFx.playBiometricVerified();
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const handleFreezeCards = () => {
    soundFx.playThreatWarning();
    setCardsFrozen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl rounded-2xl border border-rose-600 bg-slate-950 p-6 shadow-2xl space-y-5 shadow-rose-950/40 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="MoneyShield Panic Center"
      >
        <div className="flex items-center justify-between pb-3 border-b border-rose-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white animate-pulse">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-lg tracking-tight">
                Emergency Scam Response &amp; Panic Center
              </h3>
              <p className="text-xs text-rose-300 font-mono">
                Indian Cybercrime Coordination Centre (I4C) &amp; RBI Ombudsman Hotline
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 1930 Helpline Call Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/80 to-slate-900 border border-rose-800/80 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase text-rose-400 block mb-1">
              Golden Hour Financial Fraud Helpline (Govt of India)
            </span>
            <p className="text-2xl font-black text-white font-mono flex items-center gap-2">
              <PhoneCall className="h-6 w-6 text-rose-400 animate-bounce" />
              <span>Dial 1930</span>
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Calling within 2 hours of unauthorized debit allows law enforcement to freeze funds in transit across bank nodal accounts.
            </p>
          </div>

          <a
            href="tel:1930"
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950 transition-transform active:scale-95"
          >
            Direct Call 1930
          </a>
        </div>

        {/* 1-Tap Card & Mandate Freeze */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-white text-sm">Emergency Mandate &amp; Card Lockdown</p>
            <p className="text-slate-400 mt-0.5">
              Instantly broadcast token freeze to HDFC, ICICI, SBI, and NPCI clearinghouse to reject all pending debits.
            </p>
          </div>

          <button
            onClick={handleFreezeCards}
            disabled={cardsFrozen}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
              cardsFrozen
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>{cardsFrozen ? 'Lockdown Enforced' : 'Freeze All Connected Cards'}</span>
          </button>
        </div>

        {/* Pre-filled Cybercrime Complaint Dossier */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 font-mono">
              Pre-Filled Evidence Dossier for cybercrime.gov.in:
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-mono font-medium"
            >
              {copiedDraft ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedDraft ? 'Copied to Clipboard' : 'Copy Dossier'}</span>
            </button>
          </div>

          <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {complaintDraft}
          </pre>
        </div>

        {/* External Official Portal Links */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <span>National Cyber Crime Reporting Portal</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="https://cms.rbi.org.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <span>RBI Complaint Management System (CMS)</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
