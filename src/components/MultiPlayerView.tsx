import React, { useState } from 'react';
import { 
  Users, 
  Building, 
  ShieldCheck, 
  Receipt, 
  FileCheck, 
  Lock, 
  KeyRound, 
  Layers, 
  DollarSign,
  Plus
} from 'lucide-react';
import { soundFx } from '../utils/sound';

export const MultiPlayerView: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'HOUSEHOLD' | 'FREELANCER_SMB'>('FREELANCER_SMB');

  // Freelancer / SMB State
  const [gstin] = useState('27AABCT3518Q1Z4');
  const [grossReceipts, setGrossReceipts] = useState(3200000); // 32 Lakhs
  const [inputTaxCredit, setInputTaxCredit] = useState(48200);

  // Section 44ADA Presumptive Tax Calculation
  // 50% of gross receipts considered deemed profit
  const deemedProfit = grossReceipts * 0.50;
  const standardDeductions = 75000;
  const taxableUnder44ADA = Math.max(0, deemedProfit - standardDeductions);

  // Unused SaaS Seats
  const saasSeats = [
    { name: 'Figma Enterprise', totalSeats: 5, activeSeats: 3, costPerSeat: 1800, monthlyWaste: 3600 },
    { name: 'GitHub Copilot Business', totalSeats: 8, activeSeats: 6, costPerSeat: 1550, monthlyWaste: 3100 },
    { name: 'Slack Pro Workspace', totalSeats: 12, activeSeats: 12, costPerSeat: 650, monthlyWaste: 0 },
    { name: 'AWS Reserved Instances', totalSeats: 4, activeSeats: 2, costPerSeat: 4200, monthlyWaste: 8400 },
  ];

  const totalSaaSLeakage = saasSeats.reduce((acc, s) => acc + s.monthlyWaste, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Selector Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
              Multi-Player Sovereignty &amp; RBAC
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Household Vaults &amp; Freelancer/SMB Engine</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Share budgets without exposing private bank accounts. Track GST input credit and Section 44ADA presumptive profits.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => {
              soundFx.playShieldArmed();
              setActiveMode('HOUSEHOLD');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeMode === 'HOUSEHOLD'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Household Mode</span>
          </button>

          <button
            onClick={() => {
              soundFx.playShieldArmed();
              setActiveMode('FREELANCER_SMB');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeMode === 'FREELANCER_SMB'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="h-3.5 w-3.5" />
            <span>Freelancer &amp; SMB Mode</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Household Shared Vault */}
      {activeMode === 'HOUSEHOLD' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Shared Family Vault</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
                ZERO-KNOWLEDGE PRIVACY
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Household mode links shared expenses (rent, groceries, child education, utilities) into a unified ledger while strictly safeguarding your personal discretionary accounts.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white">Arjun Mehta (You)</p>
                  <p className="text-slate-500 font-mono text-[11px]">Primary Guardian • Full Access</p>
                </div>
                <span className="font-mono text-emerald-400">Owner</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white">Pooja Sharma (Partner)</p>
                  <p className="text-slate-500 font-mono text-[11px]">Household Co-Manager • Shared Category Access</p>
                </div>
                <span className="font-mono text-cyan-400">Co-Signer</span>
              </div>
            </div>

            <button
              onClick={() => soundFx.playBiometricVerified()}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium text-xs border border-slate-700 flex items-center justify-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Invite Family Member with Granular RBAC</span>
            </button>
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Shared Household Budget</h3>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Apartment Rent &amp; Society Maintenance:</span>
                  <span className="font-mono text-white">₹48,000 / ₹50,000</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: '96%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Groceries &amp; Domestic Essentials:</span>
                  <span className="font-mono text-white">₹22,400 / ₹30,000</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-400 h-full rounded-full" style={{ width: '74%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Electricity &amp; Utilities:</span>
                  <span className="font-mono text-white">₹3,820 / ₹6,000</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-400 h-full rounded-full" style={{ width: '63%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Freelancer & SMB Engine */}
      {activeMode === 'FREELANCER_SMB' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Active GSTIN Registered</span>
                <span className="font-mono text-emerald-400">18% Standard</span>
              </div>
              <p className="text-lg font-bold text-white font-mono">{gstin}</p>
              <p className="text-xs text-slate-400 mt-1">Maharashtra State Jurisdiction</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>GST Input Tax Credit (ITC)</span>
                <span className="font-mono text-teal-400">Claimable</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400 font-mono">
                ₹{inputTaxCredit.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-400 mt-1">On AWS servers, software, hardware</p>
            </div>

            <div className="rounded-2xl border border-rose-900/40 bg-gradient-to-br from-rose-950/20 to-slate-900 p-5">
              <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
                <span>Unused SaaS License Waste</span>
                <span className="font-mono">Optimization Ready</span>
              </div>
              <p className="text-2xl font-bold text-rose-300 font-mono">
                ₹{totalSaaSLeakage.toLocaleString('en-IN')}/mo
              </p>
              <p className="text-xs text-slate-400 mt-1">Idle seats on Figma, GitHub, &amp; AWS</p>
            </div>
          </div>

          {/* Section 44ADA Presumptive Taxation & SaaS Seats Bento */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 44ADA Presumptive Tax Calculator (6 Cols) */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-base">Section 44ADA Presumptive Tax</h3>
                  <p className="text-xs text-slate-400 font-mono">Eligible for Freelancers &amp; Professionals up to ₹75 Lakhs</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300">
                  50% FLAT PROFIT
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1.5 font-medium">
                    <span>Annual Professional Gross Inflows:</span>
                    <span className="font-mono text-emerald-400 font-bold">₹{grossReceipts.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="1000000"
                    max="7500000"
                    step="50000"
                    value={grossReceipts}
                    onChange={(e) => setGrossReceipts(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Deemed Net Profit (50% under 44ADA):</span>
                    <span className="text-white font-bold">₹{deemedProfit.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Standard Deduction:</span>
                    <span className="text-slate-300">-₹75,000</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-xs text-emerald-400">
                    <span>Taxable Income Base:</span>
                    <span>₹{taxableUnder44ADA.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  No book maintenance or audit required under Section 44AB. 50% of your gross professional income is legally exempt as deemed business expenditure.
                </p>
              </div>
            </div>

            {/* SaaS License Seats Optimizer (6 Cols) */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white text-base">Unused SaaS Seats Audit</h3>
                <span className="text-xs text-rose-400 font-mono font-bold">
                  ₹{(totalSaaSLeakage * 12).toLocaleString('en-IN')}/year leak
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {saasSeats.map((seat, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-200">{seat.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {seat.activeSeats} of {seat.totalSeats} seats active ({seat.totalSeats - seat.activeSeats} idle)
                      </p>
                    </div>

                    <div className="text-right">
                      {seat.monthlyWaste > 0 ? (
                        <span className="text-rose-400 font-mono font-semibold block">
                          -₹{seat.monthlyWaste.toLocaleString('en-IN')}/mo
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-mono text-[11px] block">
                          100% Utilized
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">₹{seat.costPerSeat}/seat</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
