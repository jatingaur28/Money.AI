/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BillDriftItem, DisputePacket } from '../types/intelligence';
import { Transaction, UpiMandate } from '../types';
import { auditBillTruthAndDrift, generateDisputePacket } from '../utils/billTruthEngine';
import { FileText, AlertTriangle, ArrowUpRight, Scale, Check, Copy, X, ShieldAlert, Sparkles } from 'lucide-react';

interface Props {
  mandates: UpiMandate[];
  transactions: Transaction[];
  onOpenSafeAction?: (title: string, details: any) => void;
}

export const BillTruthDriftView: React.FC<Props> = ({ mandates, transactions, onOpenSafeAction }) => {
  const [selectedDispute, setSelectedDispute] = useState<DisputePacket | null>(null);
  const [copied, setCopied] = useState(false);

  // Compute live drift items
  const driftItems = auditBillTruthAndDrift({ mandates, transactions });

  const handleCopyDraft = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold tracking-wider uppercase mb-1">
              <Scale className="w-4 h-4" />
              <span>Contract Drift & Dark-Pattern Audit</span>
            </div>
            <h2 className="text-xl font-bold text-white">Bill Truth Engine</h2>
            <p className="text-sm text-slate-400 max-w-2xl mt-1">
              Cross-references bank debits against registered UPI 2.0 e-Mandate caps. Detects stealth price increases, duplicate deductions, and unnotified FX conversions.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-800/80 border border-slate-700/80 px-4 py-2 rounded-xl">
            <div className="text-right">
              <div className="text-xs text-slate-400">Total Drift Detected</div>
              <div className="text-base font-bold text-rose-400 font-mono">
                +₹{driftItems.reduce((acc, d) => acc + d.varianceAmount, 0).toLocaleString('en-IN')}/mo
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drift Table */}
      {driftItems.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <FileText className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">Zero Contract Drift Detected</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            All active recurring debits match registered NPCI mandate caps within legal tolerances.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Flagged Pricing Drifts ({driftItems.length})
          </div>

          <div className="grid grid-cols-1 gap-4">
            {driftItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">{item.merchant}</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {item.detectedDriftType.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono">
                        UMN: {item.umn || 'N/A (Card Token)'} • Observed: {item.evidenceDate}
                      </div>
                    </div>
                  </div>

                  {/* Side-by-side comparison */}
                  <div className="flex items-center space-x-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Agreed Cap</div>
                      <div className="font-mono text-slate-300">₹{item.originalAgreedAmount.toLocaleString('en-IN')}</div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-rose-400" />
                    <div>
                      <div className="text-[10px] text-slate-400">Actual Billed</div>
                      <div className="font-mono font-bold text-white">₹{item.currentBilledAmount.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="pl-2 border-l border-slate-800">
                      <div className="text-[10px] text-rose-400 font-bold">+{item.variancePercentage}%</div>
                      <div className="text-[9px] text-slate-400">+₹{item.varianceAmount}</div>
                    </div>
                  </div>
                </div>

                {/* Evidence Snippet */}
                <div className="pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <p className="text-slate-300 text-[11px] bg-slate-800/40 p-2 rounded-lg border border-slate-800 flex-1">
                    <span className="text-slate-400 font-semibold mr-1">Evidence:</span>
                    {item.receiptSnippet}
                  </p>

                  <button
                    onClick={() => {
                      const packet = generateDisputePacket(item);
                      setSelectedDispute(packet);
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Generate RBI Dispute Packet</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">RBI Formal Dispute Copilot</h3>
                  <p className="text-xs text-slate-400">
                    Compliant with Master Direction RBI/2020-21/74 on e-Mandates
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDispute(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700">
                <div>
                  <span className="text-slate-400">Disputed Merchant:</span>
                  <div className="font-bold text-white mt-0.5">{selectedDispute.merchant}</div>
                </div>
                <div>
                  <span className="text-slate-400">Excess Debited Amount:</span>
                  <div className="font-bold font-mono text-rose-400 mt-0.5">
                    ₹{selectedDispute.amountDisputed.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Statutory TAT Window:</span>
                  <div className="font-medium text-emerald-400 mt-0.5">
                    {selectedDispute.statutoryResolutionWindow}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Regulatory Framework:</span>
                  <div className="font-medium text-slate-200 mt-0.5 truncate">
                    {selectedDispute.regulatoryReference}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-300">
                    Pre-Drafted Nodal Grievance Notice (Copy & Send):
                  </span>
                  <button
                    onClick={() => handleCopyDraft(selectedDispute.complaintLetterDraft)}
                    className="flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied to Clipboard' : 'Copy Notice Draft'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={selectedDispute.complaintLetterDraft}
                  rows={10}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <button
                onClick={() => setSelectedDispute(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  if (onOpenSafeAction) {
                    onOpenSafeAction(`File Formal Chargeback against ${selectedDispute.merchant}`, {
                      disputeId: selectedDispute.id,
                      amount: selectedDispute.amountDisputed,
                      umn: selectedDispute.umn,
                    });
                  }
                  setSelectedDispute(null);
                }}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Submit to Bank via Safe Action</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
