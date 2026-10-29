/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { evaluatePaymentPreflight } from '../utils/paymentPreflight';
import { PreflightAnalysis } from '../types/intelligence';
import { ShieldAlert, ShieldCheck, AlertTriangle, QrCode, ArrowRight, X, ExternalLink, Copy, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInitiateSafeBlock?: (vpa: string, reason: string) => void;
}

const PRESETS = [
  {
    name: 'Benign Swiggy UPI QR',
    text: 'upi://pay?pa=swiggy@icici&pn=Swiggy%20Order&am=649&cu=INR&mc=5812',
    merchant: 'Swiggy',
  },
  {
    name: 'Urgent Electricity Scam QR',
    text: 'Dear Consumer, Electricity will be disconnected tonight at 9:30 PM due to unpaid bill. Pay immediately: upi://pay?pa=sbi-kyc-refund@paytm&pn=Electricity%20Desk&am=12450&cu=INR',
    merchant: 'Tata Power Electricity Board',
  },
  {
    name: 'SBI Homograph KYC Link',
    text: 'Important SBI Notice: Complete mandatory PAN verification immediately to avoid debit block at https://onlinesbi.sbi-support.cc/kyc',
    merchant: 'State Bank of India',
  },
];

export const PaymentPreflightModal: React.FC<Props> = ({ isOpen, onClose, onInitiateSafeBlock }) => {
  const [inputText, setInputText] = useState(PRESETS[0].text);
  const [expectedMerchant, setExpectedMerchant] = useState(PRESETS[0].merchant);
  const [analysis, setAnalysis] = useState<PreflightAnalysis | null>(() => 
    evaluatePaymentPreflight({ rawInput: PRESETS[0].text, expectedMerchant: PRESETS[0].merchant })
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleScanOrAnalyze = (raw: string, merchant?: string) => {
    setInputText(raw);
    const m = merchant !== undefined ? merchant : expectedMerchant;
    const res = evaluatePaymentPreflight({
      rawInput: raw,
      expectedMerchant: m || undefined,
    });
    setAnalysis(res);
  };

  const handleCopyVpa = (vpa: string) => {
    navigator.clipboard.writeText(vpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Payment Preflight Scanner
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Zero-Execution Sandbox
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Safely inspect UPI QR codes, links & SMS intents before initiating any transaction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Preset Buttons */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select or Paste Payment Payload:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setExpectedMerchant(preset.merchant);
                    handleScanOrAnalyze(preset.text, preset.merchant);
                  }}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                    inputText === preset.text
                      ? 'bg-purple-950/40 border-purple-500/50 text-purple-200'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-medium truncate">{preset.name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{preset.merchant}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Text Input Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="text-slate-300 font-medium">Raw Payload (UPI URI, URL, or SMS Message):</label>
              <span className="text-[11px] text-slate-400">Will never auto-execute or open browser</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => handleScanOrAnalyze(e.target.value)}
              rows={3}
              placeholder="Paste UPI QR payload (upi://pay?...), payment link, or suspicious message..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Analysis Results Display */}
          {analysis && (
            <div className="space-y-4">
              {/* Verdict Header */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  analysis.verdict === 'CLEAN'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : analysis.verdict === 'CAUTION'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {analysis.verdict === 'CLEAN' ? (
                    <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                  ) : analysis.verdict === 'CAUTION' ? (
                    <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-8 h-8 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold uppercase tracking-wider">
                        VERDICT: {analysis.verdict}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-900/60 border border-current">
                        Risk Score: {analysis.riskScore}/100
                      </span>
                    </div>
                    <p className="text-xs opacity-90 mt-0.5">{analysis.intentSummary}</p>
                  </div>
                </div>
              </div>

              {/* Parsed Attributes */}
              {analysis.parsedUpi && (
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Decoded Intent Parameters
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Target VPA:</span>
                      <div className="font-mono text-cyan-300 font-medium flex items-center gap-1.5 mt-0.5">
                        <span className="truncate">{analysis.targetVpa}</span>
                        <button
                          onClick={() => handleCopyVpa(analysis.targetVpa)}
                          className="text-slate-400 hover:text-white"
                          title="Copy VPA"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Registered Payee Name:</span>
                      <div className="font-medium text-white mt-0.5">{analysis.targetPayee}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Requested Amount:</span>
                      <div className="font-mono font-bold text-white mt-0.5">
                        {analysis.requestedAmount ? `₹${analysis.requestedAmount.toLocaleString('en-IN')}` : 'Variable / Open Checkout'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Merchant Code (MCC):</span>
                      <div className="font-mono text-slate-300 mt-0.5">
                        {analysis.parsedUpi.merchantCode || 'P2P Consumer (No registered merchant MCC)'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detected Risk Flags */}
              {analysis.flags.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Risk Indicators & Evidence:
                  </div>
                  {analysis.flags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-rose-300 font-semibold">
                        <span>{flag.category}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20">
                          {flag.severity}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{flag.description}</p>
                      <div className="text-[10px] font-mono text-rose-200 bg-slate-900/40 p-1.5 rounded border border-rose-500/20 truncate">
                        Evidence: {flag.evidence}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Safe Next Step Guidance */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
                <span className="text-slate-400 font-medium">Safe Next Step:</span>
                <p className="text-white font-medium mt-1">{analysis.safeNextStep}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-300 hover:text-white text-xs font-medium"
          >
            Close Inspector
          </button>

          {analysis && analysis.verdict === 'DANGEROUS' && (
            <button
              onClick={() => {
                if (onInitiateSafeBlock) {
                  onInitiateSafeBlock(analysis.targetVpa, analysis.flags.map(f => f.description).join('; '));
                }
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-rose-900/30"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Block & Report via Safe Action</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
