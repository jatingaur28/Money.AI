/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CoverageGapAudit } from '../types/intelligence';
import { ShieldCheck, AlertTriangle, RefreshCw, ChevronRight, CheckCircle2, Clock, X, Database } from 'lucide-react';

interface Props {
  audit: CoverageGapAudit;
  onRefresh?: () => void;
}

export const ConfidenceCoverageBadge: React.FC<Props> = ({ audit, onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">VERIFIED FACT</span>;
      case 'PARTIAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">PARTIAL SYNC</span>;
      case 'STALE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">STALE &gt;30D</span>;
      case 'MISSING':
      case 'UNLINKED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">BLIND SPOT</span>;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Top Banner Chip */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border transition-all text-xs cursor-pointer hover:brightness-110 ${getScoreColor(audit.overallCoverageScore)}`}
        title="View Confidence & Coverage Map"
      >
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <div className="flex items-center space-x-1.5">
          <span className="font-semibold">{audit.overallCoverageScore}% Coverage</span>
          <span className="text-[10px] opacity-75">|</span>
          <span className="text-[11px] opacity-90">{audit.verifiedFactsCount} Verified</span>
          {audit.staleFactsCount > 0 && (
            <span className="text-[10px] bg-amber-500/30 text-amber-200 px-1.5 py-0.2 rounded font-mono">
              {audit.staleFactsCount} Stale
            </span>
          )}
          {audit.unlinkedDomainsCount > 0 && (
            <span className="text-[10px] bg-rose-500/30 text-rose-200 px-1.5 py-0.2 rounded font-mono">
              {audit.unlinkedDomainsCount} Gaps
            </span>
          )}
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60 ml-1" />
      </button>

      {/* Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg h-full bg-slate-900 border-l border-slate-800 p-6 flex flex-col shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Confidence & Coverage Map</h3>
                  <p className="text-xs text-slate-400">Truth in Data: Provenance, Staleness & Blind Spots</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Summary Box */}
            <div className="my-5 p-4 rounded-xl bg-slate-800/60 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Perimeter Coverage Metric</div>
                  <div className="text-2xl font-bold text-white mt-0.5">{audit.overallCoverageScore}% Confirmed</div>
                </div>
                <div className={`text-xs px-2.5 py-1 rounded-md font-mono font-medium border ${getScoreColor(audit.overallCoverageScore)}`}>
                  {audit.overallCoverageScore >= 80 ? 'HIGH FIDELITY' : 'PARTIAL COVERAGE'}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${audit.overallCoverageScore}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                  <div className="text-emerald-400 font-semibold">{audit.verifiedFactsCount}</div>
                  <div className="text-[10px] text-slate-400">Verified APIs</div>
                </div>
                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                  <div className="text-amber-400 font-semibold">{audit.staleFactsCount}</div>
                  <div className="text-[10px] text-slate-400">Stale &gt;30d</div>
                </div>
                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                  <div className="text-rose-400 font-semibold">{audit.unlinkedDomainsCount}</div>
                  <div className="text-[10px] text-slate-400">Missing Gaps</div>
                </div>
              </div>
            </div>

            {/* High Priority Gaps Callout */}
            {audit.highPriorityGaps.length > 0 && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs">
                <div className="flex items-center space-x-2 text-rose-300 font-medium mb-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Critical Visibility Gaps Detected</span>
                </div>
                <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                  {audit.highPriorityGaps.map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Granular Items List */}
            <div className="flex-1 space-y-3">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Domain Provenance Audits
              </div>

              {audit.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{item.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Domain: <span className="font-mono text-slate-300">{item.domain}</span>
                        {item.freshnessDays < 999 && (
                          <span className="ml-2 inline-flex items-center text-slate-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {item.freshnessDays === 0 ? 'Live (Today)' : `${item.freshnessDays}d ago`}
                          </span>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  {item.gapImpactDescription && (
                    <div className="mt-2 text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      {item.gapImpactDescription}
                    </div>
                  )}

                  {item.recommendedAction && (
                    <div className="mt-2 flex items-center justify-between text-[11px] text-cyan-400">
                      <span>{item.recommendedAction}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Zero-Trust Provenance Model Active</span>
              <button
                onClick={() => {
                  if (onRefresh) onRefresh();
                  setIsOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-verify Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
