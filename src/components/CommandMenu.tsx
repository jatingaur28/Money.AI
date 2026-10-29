import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShieldCheck, 
  Trash2, 
  FileText, 
  Sparkles, 
  TrendingUp, 
  Users, 
  ExternalLink,
  X,
  CreditCard
} from 'lucide-react';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onTriggerAction: (actionId: string) => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onTriggerAction,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickActions = [
    {
      id: 'scan-url',
      title: 'Detonate Suspicious URL or Shortener',
      category: 'Fraud Shield',
      icon: ShieldCheck,
      action: () => {
        onNavigate('fraud_shield');
        onTriggerAction('focus-detonator');
        onClose();
      },
    },
    {
      id: 'kill-autopay',
      title: 'Review & Eradicate Predatory AutoPay Mandates',
      category: 'AutoPay & Subscriptions',
      icon: Trash2,
      action: () => {
        onNavigate('autopay');
        onClose();
      },
    },
    {
      id: 'portfolio-designer',
      title: 'AI Portfolio Designer (MPT Asset Allocator & Drift Rebalancer)',
      category: 'Portfolio & Wealth',
      icon: TrendingUp,
      action: () => {
        onNavigate('yield');
        onClose();
      },
    },
    {
      id: 'tax-planner',
      title: 'Advanced AI Tax Planner & March 31 Tax-Loss Harvester',
      category: 'Yield & Tax Engine',
      icon: Sparkles,
      action: () => {
        onNavigate('yield');
        onClose();
      },
    },
    {
      id: 'tax-compare',
      title: 'Simulate Old vs New Tax Regime (FY 2024-26)',
      category: 'Yield & Tax Engine',
      icon: TrendingUp,
      action: () => {
        onNavigate('yield');
        onClose();
      },
    },
    {
      id: 'upload-statement',
      title: 'Upload Bank Statement (CSV or PDF OCR)',
      category: 'Transactions',
      icon: FileText,
      action: () => {
        onNavigate('transactions');
        onTriggerAction('trigger-upload');
        onClose();
      },
    },
    {
      id: 'ask-assistant',
      title: 'Ask AI Guardian: "How much did I spend on Swiggy?"',
      category: 'AI Assistant',
      icon: Sparkles,
      action: () => {
        onNavigate('agent');
        onClose();
      },
    },
    {
      id: 'household-toggle',
      title: 'Switch to Freelancer / SMB Tax Mode (GST & 44ADA)',
      category: 'Multi-Player',
      icon: Users,
      action: () => {
        onNavigate('multiplayer');
        onClose();
      },
    },
  ];

  const filtered = quickActions.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden shadow-emerald-950/20"
        role="dialog"
        aria-modal="true"
        aria-label="MoneyShield Command Palette"
      >
        <div className="flex items-center px-4 py-3 border-b border-slate-800 gap-3">
          <Search className="h-5 w-5 text-emerald-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, navigate vaults, detonate links, or inspect tax rules..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
            aria-label="Close command palette"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-800/40">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
            Suggested Guardian Operations
          </div>
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No matching operations found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-slate-800/80 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-emerald-950/60 text-slate-300 group-hover:text-emerald-400 border border-slate-700/60 group-hover:border-emerald-600/40 transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200 group-hover:text-white">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500">{item.category}</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-600 group-hover:text-slate-300" />
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="rounded bg-slate-800 px-1 py-0.5 border border-slate-700 text-[10px] font-mono">ESC</kbd> to exit</span>
          </div>
          <span className="font-mono text-emerald-400 text-[11px]">MoneyShield Core Heuristics Ready</span>
        </div>
      </div>
    </div>
  );
};
