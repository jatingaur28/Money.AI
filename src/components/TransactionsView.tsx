import React, { useState } from 'react';
import { 
  Search, 
  Upload, 
  Filter, 
  Download, 
  Tag, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { Transaction, TaxTag, TransactionCategory } from '../types';
import { soundFx } from '../utils/sound';

interface TransactionsViewProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  initialUploadTrigger?: boolean;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onAddTransaction,
  initialUploadTrigger = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [showUploadModal, setShowUploadModal] = useState(initialUploadTrigger);
  const [csvRawText, setCsvRawText] = useState('');

  // Semantic query matching (natural language queries like "food", "uber", "tax 80d", "insurance")
  const filtered = transactions.filter((tx) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      tx.merchantName.toLowerCase().includes(q) ||
      tx.category.toLowerCase().includes(q) ||
      (tx.notes && tx.notes.toLowerCase().includes(q)) ||
      (tx.taxTag && tx.taxTag.toLowerCase().includes(q)) ||
      (q.includes('food') && tx.category === 'Food & Dining') ||
      (q.includes('travel') && tx.category === 'Travel & Transit') ||
      (q.includes('tax') && tx.taxTag && tx.taxTag !== 'Non_Tax_Deductible');

    const matchesTag =
      selectedTag === 'ALL' ||
      (selectedTag === 'TAX_DEDUCTIBLE' && tx.taxTag && tx.taxTag !== 'Non_Tax_Deductible') ||
      tx.taxTag === selectedTag;

    return matchesSearch && matchesTag;
  });

  const totalDeductible80C = transactions
    .filter((t) => t.taxTag === '80C')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDeductible80D = transactions
    .filter((t) => t.taxTag === '80D')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBusiness44ADA = transactions
    .filter((t) => t.taxTag === '44ADA_Business')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleSimulateUpload = () => {
    soundFx.playBiometricVerified();
    const newTx: Transaction = {
      id: `tx-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      merchantName: 'Star Health Family Optima',
      merchantVpa: 'starhealth.premium@icici',
      category: 'Healthcare & Wellness',
      type: 'netbanking',
      amount: 18500,
      isDebit: true,
      taxTag: '80D',
      carbonKg: 0.1,
      notes: 'Imported from HDFC Bank PDF e-Statement (Sec 80D Tax Tagged)',
    };
    onAddTransaction(newTx);
    setShowUploadModal(false);
  };

  const handleExportCsv = () => {
    soundFx.playShieldArmed();
    const headers = 'ID,Date,Merchant,Category,Type,Amount,DebitCredit,TaxTag,Notes\n';
    const rows = transactions
      .map(
        (t) =>
          `"${t.id}","${t.date}","${t.merchantName}","${t.category}","${t.type}",${t.amount},"${
            t.isDebit ? 'DEBIT' : 'CREDIT'
          }","${t.taxTag || 'NONE'}","${t.notes || ''}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MoneyShield_Transactions_Tax_Audit_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Tax Deductions & Aggregations Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Section 80C Tax Tagged</span>
            <span className="font-mono text-cyan-400">Cap: ₹1,50,000</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            ₹{totalDeductible80C.toLocaleString('en-IN')}
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full"
              style={{ width: `${Math.min(100, (totalDeductible80C / 150000) * 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Section 80D Health Tagged</span>
            <span className="font-mono text-emerald-400">Cap: ₹75,000</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            ₹{totalDeductible80D.toLocaleString('en-IN')}
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full"
              style={{ width: `${Math.min(100, (totalDeductible80D / 75000) * 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Section 44ADA Business Deductions</span>
            <span className="font-mono text-teal-400">Freelancer Mode</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            ₹{totalBusiness44ADA.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Cloud servers, software licenses, travel
          </p>
        </div>
      </div>

      {/* Main Filter & Action Controls */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Semantic Search Input */}
          <div className="flex-1 min-w-[280px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search semantically: 'Food delivery', 'Uber rides BKC', '80D medical', 'ELSS'..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import Statement (OCR/CSV)</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CA Export</span>
            </button>
          </div>
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Quick Filter:
          </span>
          {[
            { id: 'ALL', label: 'All Transactions' },
            { id: 'TAX_DEDUCTIBLE', label: 'All Tax Deductible' },
            { id: '80C', label: 'Sec 80C (ELSS/PPF)' },
            { id: '80D', label: 'Sec 80D (Health)' },
            { id: '44ADA_Business', label: 'Sec 44ADA (Freelance)' },
          ].map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                selectedTag === tag.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-mono uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date &amp; Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Indian Tax Tag</th>
                <th className="py-3 px-4">Anomaly / Dark Pattern</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-100">{tx.merchantName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {tx.date} {tx.merchantVpa ? `• ${tx.merchantVpa}` : ''}
                    </div>
                    {tx.notes && <div className="text-[11px] text-slate-400 italic mt-0.5">{tx.notes}</div>}
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium text-[11px]">
                      {tx.category}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono uppercase text-[11px] text-slate-400">
                    {tx.type}
                  </td>

                  <td className="py-3 px-4">
                    {tx.taxTag && tx.taxTag !== 'Non_Tax_Deductible' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <Tag className="h-2.5 w-2.5" />
                        {tx.taxTag}
                      </span>
                    ) : (
                      <span className="text-slate-600 font-mono text-[11px]">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {tx.anomalyWarning ? (
                      <span className="inline-flex items-center gap-1 text-rose-400 text-[11px]">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>{tx.anomalyWarning}</span>
                      </span>
                    ) : tx.darkPatternFlag ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 text-[11px]">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>Dark Pattern Recurring Charge</span>
                      </span>
                    ) : (
                      <span className="text-emerald-500/80 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified Clean
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                    <span className={tx.isDebit ? 'text-slate-100' : 'text-emerald-400'}>
                      {tx.isDebit ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statement Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Import Bank Statement</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              All statement parsing executes completely client-side in your browser sandbox. MoneyShield extracts merchants, flags UPI handles, and auto-tags Section 80C/80D expenses with zero server upload.
            </p>

            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-6 text-center cursor-pointer bg-slate-950/40">
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-200 font-semibold">Drop PDF e-Statement or CSV here</p>
              <p className="text-[11px] text-slate-500 mt-1">Supports HDFC, ICICI, SBI, Axis, Kotak Bank formats</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulateUpload}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
              >
                Simulate OCR Parse &amp; Ingest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
