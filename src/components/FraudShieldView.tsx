import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  QrCode, 
  MessageSquareWarning, 
  Flame, 
  ExternalLink, 
  Share2, 
  Search, 
  Lock, 
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Terminal,
  Zap,
  Camera,
  Layers
} from 'lucide-react';
import { ThreatItem } from '../types';
import { ThreatIntelAdapter, URLScanResult, SMSTextAnalysisResult } from '../adapters/threatAdapter';
import { analyzeUpiVpa, scoreSmsPayload, detectHomographAttack } from '../utils/fraudDetection';
import { soundFx } from '../utils/sound';

interface FraudShieldViewProps {
  threats: ThreatItem[];
  onAddThreat: (threat: ThreatItem) => void;
  onOpenPanic: () => void;
}

export const FraudShieldView: React.FC<FraudShieldViewProps> = ({
  threats,
  onAddThreat,
  onOpenPanic,
}) => {
  const [shieldTab, setShieldTab] = useState<'DETONATOR' | 'SMS_SCANNER' | 'QR_SCANNER' | 'FEDERATED_FEED'>('DETONATOR');

  // URL Detonator State
  const [urlInput, setUrlInput] = useState('https://hdfcbаnk-netportal.in/kyc-update-pan.html');
  const [urlScanResult, setUrlScanResult] = useState<URLScanResult | null>(null);
  const [isScanningUrl, setIsScanningUrl] = useState(false);

  // SMS / Text Scanner State
  const [smsInput, setSmsInput] = useState(
    'Dear customer your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill. Immediately contact power officer on 9821902111 or install http://bit.ly/mpeb-bill.apk'
  );
  const [smsScanResult, setSmsScanResult] = useState<SMSTextAnalysisResult | null>(null);
  const [isScanningSms, setIsScanningSms] = useState(false);

  // QR Scanner State
  const [qrPayload, setQrPayload] = useState('upi://pay?pa=swiggy.support.refund99@okhdfcbank&pn=Swiggy%20Helpdesk&am=2400');
  const [qrAnalysis, setQrAnalysis] = useState<ReturnType<typeof analyzeUpiVpa> | null>(null);

  // Federated Community Feed State
  const [communityThreats, setCommunityThreats] = useState<ThreatItem[]>(threats);
  const [newScamText, setNewScamText] = useState('');
  const [isSubmittingScam, setIsSubmittingScam] = useState(false);

  const threatAdapter = new ThreatIntelAdapter();

  const handleDetonateUrl = async () => {
    if (!urlInput.trim()) return;
    setIsScanningUrl(true);
    soundFx.playShieldArmed();

    const res = await threatAdapter.detonateUrl(urlInput);
    setUrlScanResult(res);
    setIsScanningUrl(false);

    if (res.status === 'MALICIOUS') {
      soundFx.playThreatWarning();
    } else {
      soundFx.playBiometricVerified();
    }
  };

  const handleScanSms = async () => {
    if (!smsInput.trim()) return;
    setIsScanningSms(true);
    soundFx.playShieldArmed();

    const res = await threatAdapter.analyzeMessagePayload(smsInput);
    setSmsScanResult(res);
    setIsScanningSms(false);

    if (res.threatLevel === 'CRITICAL') {
      soundFx.playThreatWarning();
    } else {
      soundFx.playBiometricVerified();
    }
  };

  const handleAnalyzeQr = () => {
    soundFx.playShieldArmed();
    const vpaMatch = qrPayload.match(/pa=([^&]+)/i);
    const vpa = vpaMatch ? decodeURIComponent(vpaMatch[1]) : qrPayload;
    const result = analyzeUpiVpa(vpa);
    setQrAnalysis(result);

    if (result.threatLevel === 'CRITICAL') {
      soundFx.playThreatWarning();
    } else {
      soundFx.playBiometricVerified();
    }
  };

  const handleReportScam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScamText.trim()) return;
    setIsSubmittingScam(true);
    soundFx.playShieldArmed();

    const res = await threatAdapter.submitFederatedThreat({
      type: 'USER_SUBMITTED',
      rawIndicator: newScamText,
      notes: 'Submitted via Zero-Trust Anonymous Community Uplink',
    });

    const newThreat: ThreatItem = {
      id: res.signatureId,
      timestamp: new Date().toISOString(),
      type: 'SMS_PHISHING',
      severity: 'HIGH',
      title: 'Community Ingested Scam Payload',
      rawPayload: newScamText,
      riskScore: 84,
      indicators: ['Fresh crowd-sourced telemetry signature', 'Extracted from live user incident'],
      recommendedAction: 'Block sender immediately; threat payload added to all connected MoneyShield nodes.',
      isContained: true,
      source: 'USER_SUBMITTED',
    };

    setCommunityThreats([newThreat, ...communityThreats]);
    onAddThreat(newThreat);
    setNewScamText('');
    setIsSubmittingScam(false);
    soundFx.playBiometricVerified();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Threat Vectors Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
                Edge AI Defense Mesh
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">Zero-Day AI Fraud Shield</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Local on-device NLP, homograph punycode inspection, spoofed UPI VPA detection, and real-time sandboxed URL detonation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenPanic}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 transition-transform active:scale-95"
            >
              <PhoneCall className="h-4 w-4 animate-bounce" />
              <span>1-Tap Panic / 1930 Helpline</span>
            </button>
          </div>
        </div>

        {/* Shield Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
          {[
            { id: 'DETONATOR', label: 'Link Detonator (Sandbox)', icon: Globe },
            { id: 'SMS_SCANNER', label: 'Local SMS & WhatsApp Scanner', icon: MessageSquareWarning },
            { id: 'QR_SCANNER', label: 'UPI QR & VPA Analyzer', icon: QrCode },
            { id: 'FEDERATED_FEED', label: 'Federated Threat Signatures', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = shieldTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setShieldTab(tab.id as typeof shieldTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Sandboxed Link Detonator */}
      {shieldTab === 'DETONATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-400" />
                <span>Sandboxed URL Detonation Chamber</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Safely inspect shortened links, deceptive subdomains, and punycode Cyrillic homograph attacks without browser risk.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">Target URL or Shortener:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://paytm-kyc-verify.com/login"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 font-mono focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  onClick={handleDetonateUrl}
                  disabled={isScanningUrl}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>{isScanningUrl ? 'Detonating...' : 'Detonate'}</span>
                </button>
              </div>
            </div>

            {/* Quick Test Vectors */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] text-slate-500 font-mono uppercase">Sample Attack Vectors:</span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => setUrlInput('https://hdfcbаnk-netportal.in/kyc-update-pan.html')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 font-mono text-[11px]"
                >
                  Homograph Cyrillic HDFC
                </button>
                <button
                  onClick={() => setUrlInput('http://bit.ly/mpeb-urgent-bill.apk')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 font-mono text-[11px]"
                >
                  Shortened Electricity APK
                </button>
                <button
                  onClick={() => setUrlInput('https://www.incometax.gov.in/iec/foportal')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 font-mono text-[11px]"
                >
                  Official Income Tax Portal
                </button>
              </div>
            </div>
          </div>

          {/* Results Box */}
          <div className="lg:col-span-6">
            {urlScanResult ? (
              <div className={`rounded-2xl border p-6 space-y-4 shadow-xl ${
                urlScanResult.status === 'MALICIOUS'
                  ? 'border-rose-900/60 bg-rose-950/20'
                  : urlScanResult.status === 'SUSPICIOUS'
                  ? 'border-amber-900/60 bg-amber-950/20'
                  : 'border-emerald-900/60 bg-emerald-950/20'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    {urlScanResult.status === 'MALICIOUS' ? (
                      <ShieldAlert className="h-6 w-6 text-rose-400" />
                    ) : urlScanResult.status === 'SUSPICIOUS' ? (
                      <AlertTriangle className="h-6 w-6 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                    )}
                    <div>
                      <h4 className="font-bold text-white text-base">
                        Safety Verdict: {urlScanResult.status}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">
                        Safety Confidence Score: <strong className="text-white">{urlScanResult.safetyScore}/100</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-slate-300 leading-relaxed font-medium">
                    {urlScanResult.verdictReason}
                  </p>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Domain Age:</span>
                      <span className="text-slate-300">{urlScanResult.domainAgeDays} days old</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Homograph Attack Detected:</span>
                      <span className={urlScanResult.homographDetected ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {urlScanResult.homographDetected ? 'YES (Cyrillic \\u0430 spoof)' : 'NO'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Edge Resolver:</span>
                      <span className="text-slate-300">{urlScanResult.ipLocation}</span>
                    </div>
                  </div>

                  {urlScanResult.threatTypes.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] text-slate-400 font-mono block mb-1">Detected Signatures:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {urlScanResult.threatTypes.map((t, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center border border-slate-800 rounded-2xl p-10 text-center text-slate-500 text-xs">
                Enter any URL or shortened link to run sandboxed heuristics and punycode inspection.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Local SMS / WhatsApp Heuristic Scanner */}
      {shieldTab === 'SMS_SCANNER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <MessageSquareWarning className="h-4 w-4 text-emerald-400" />
                <span>On-Device SMS / WhatsApp Heuristic Engine</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Zero data egress: Message tokens are analyzed completely inside your local browser memory using regex heuristics and edge NLP.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">Paste Suspicious Message Text:</label>
              <textarea
                rows={4}
                value={smsInput}
                onChange={(e) => setSmsInput(e.target.value)}
                placeholder="Paste incoming SMS or WhatsApp notification..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={handleScanSms}
                disabled={isScanningSms}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Search className="h-3.5 w-3.5" />
                <span>{isScanningSms ? 'Evaluating Local Heuristics...' : 'Scan Message for Threats'}</span>
              </button>
            </div>

            <div className="space-y-1 pt-2">
              <span className="text-[11px] text-slate-500 font-mono uppercase">Quick Presets:</span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => setSmsInput('Dear customer your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill. Immediately contact power officer on 9821902111 or install http://bit.ly/mpeb-bill.apk')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 text-[11px]"
                >
                  Electricity Bill Cut Scrip
                </button>
                <button
                  onClick={() => setSmsInput('Dear SBI User, your NetBanking account has been deactivated today due to non-KYC update. Kindly click here immediately to update PAN: https://sbi-secure-pan.in')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 text-[11px]"
                >
                  Fake KYC Deactivation
                </button>
                <button
                  onClick={() => setSmsInput('492019 is your OTP to authorize transaction of INR 1,480 at Swiggy. Valid for 10 mins. Do not share.')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 text-[11px]"
                >
                  Legitimate Bank OTP
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            {smsScanResult ? (
              <div className={`rounded-2xl border p-6 space-y-4 shadow-xl ${
                smsScanResult.threatLevel === 'CRITICAL'
                  ? 'border-rose-900/60 bg-rose-950/20'
                  : smsScanResult.threatLevel === 'SUSPICIOUS'
                  ? 'border-amber-900/60 bg-amber-950/20'
                  : 'border-emerald-900/60 bg-emerald-950/20'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="font-bold text-white text-base">
                      Threat Assessment: {smsScanResult.threatLevel}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Calculated Scam Probability: <strong className="text-white">{smsScanResult.riskScore}%</strong>
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                    smsScanResult.threatLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {smsScanResult.threatLevel}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold block mb-1">Recommended Guardian Action:</span>
                    <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-medium">
                      {smsScanResult.suggestedAction}
                    </p>
                  </div>

                  {smsScanResult.detectedVectors.length > 0 && (
                    <div>
                      <span className="text-[11px] text-slate-400 font-mono block mb-1.5">Detected Social Engineering Vectors:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {smsScanResult.detectedVectors.map((v, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                            {v.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {smsScanResult.extractedLinks.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] text-slate-400 font-mono block mb-1">Extracted URL Links:</span>
                      {smsScanResult.extractedLinks.map((link, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px]">
                          <span className="text-rose-400 truncate max-w-xs">{link}</span>
                          <button
                            onClick={() => {
                              setUrlInput(link);
                              setShieldTab('DETONATOR');
                            }}
                            className="text-emerald-400 hover:text-emerald-300 font-semibold"
                          >
                            Detonate &rarr;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center border border-slate-800 rounded-2xl p-10 text-center text-slate-500 text-xs">
                Paste any text message or notification to evaluate phishing indicators and dangerous APK downloads.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: UPI QR & VPA Analyzer */}
      {shieldTab === 'QR_SCANNER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <QrCode className="h-4 w-4 text-emerald-400" />
                <span>UPI QR Code &amp; VPA Reputation Engine</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Prevents reverse-charge scams, spoofed merchant handles, and fake customer care refund VPAs.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">Scanned UPI URI or Virtual Payment Address (VPA):</label>
              <textarea
                rows={3}
                value={qrPayload}
                onChange={(e) => setQrPayload(e.target.value)}
                placeholder="upi://pay?pa=merchant@okhdfcbank&pn=MerchantName&am=500"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 font-mono focus:outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={handleAnalyzeQr}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Analyze VPA Reputation</span>
              </button>
            </div>

            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] text-slate-500 font-mono uppercase">Quick Test QR Payloads:</span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => setQrPayload('upi://pay?pa=swiggy.support.refund99@okhdfcbank&pn=Swiggy%20Helpdesk&am=2400')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 font-mono text-[11px]"
                >
                  Spoofed Swiggy Refund VPA
                </button>
                <button
                  onClick={() => setQrPayload('upi://pay?pa=swiggy.instamart@icici&pn=Bundl%20Technologies%20Pvt%20Ltd&am=1480')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 font-mono text-[11px]"
                >
                  Verified Official Swiggy Merchant
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            {qrAnalysis ? (
              <div className={`rounded-2xl border p-6 space-y-4 shadow-xl ${
                qrAnalysis.threatLevel === 'CRITICAL'
                  ? 'border-rose-900/60 bg-rose-950/20'
                  : qrAnalysis.threatLevel === 'CAUTION'
                  ? 'border-amber-900/60 bg-amber-950/20'
                  : 'border-emerald-900/60 bg-emerald-950/20'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="font-bold text-white text-base">
                      VPA Threat Status: {qrAnalysis.threatLevel}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Trust Metric: <strong className="text-white">{100 - qrAnalysis.score}/100</strong>
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                    qrAnalysis.threatLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {qrAnalysis.threatLevel}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Impersonation Likelihood:</span>
                      <span className={qrAnalysis.threatLevel === 'CRITICAL' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {qrAnalysis.threatLevel === 'CRITICAL' ? 'EXTREME (Corporate Masking)' : 'NONE DETECTED'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">NPCI Beneficiary Name:</span>
                      <span className="text-slate-200">
                        {qrAnalysis.threatLevel === 'CRITICAL' ? 'MOHD *** KHAN (P2P Non-Merchant)' : 'BUNDL TECHNOLOGIES PRIVATE LIMITED'}
                      </span>
                    </div>
                  </div>

                  {qrAnalysis.flags.length > 0 && (
                    <div>
                      <span className="text-[11px] text-slate-400 font-mono block mb-1">Security Flags:</span>
                      <ul className="space-y-1">
                        {qrAnalysis.flags.map((flag, idx) => (
                          <li key={idx} className="text-rose-300 flex items-start gap-1.5 text-xs">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                            <span>{flag}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center border border-slate-800 rounded-2xl p-10 text-center text-slate-500 text-xs">
                Inspect any UPI QR code payload to verify whether the payee is a registered merchant or a spoofed P2P account.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Federated Threat Feed */}
      {shieldTab === 'FEDERATED_FEED' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-base">Federated Threat Intelligence Uplink</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Community-sourced threat signatures protecting 420,000+ Indian consumers with zero PII disclosure.
              </p>
            </div>

            <form onSubmit={handleReportScam} className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                value={newScamText}
                onChange={(e) => setNewScamText(e.target.value)}
                placeholder="Report new scam URL or SMS payload..."
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 w-full md:w-80 font-mono focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="submit"
                disabled={isSubmittingScam}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs whitespace-nowrap"
              >
                {isSubmittingScam ? 'Broadcasting...' : 'Broadcast Signature'}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communityThreats.map((threat) => (
              <div
                key={threat.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-emerald-400 text-[11px]">{threat.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {threat.severity}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm">{threat.title}</h4>
                  <p className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 mt-2 truncate">
                    {threat.rawPayload}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
                  <div className="text-[11px] text-slate-400">
                    Action: <span className="text-slate-200">{threat.recommendedAction}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Source: {threat.source}</span>
                    <span className="text-emerald-400 font-semibold">CONTAINED</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
