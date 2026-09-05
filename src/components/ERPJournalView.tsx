import React, { useState, useMemo } from 'react';
import { ReconciliationResults } from '../types';
import {
  generateERPJournalVoucher,
  generateTallyXML,
  generateZohoCSV,
  ERPJournalVoucher,
} from '../erpJournal';
import {
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  Code2,
  Table,
  Building,
  ShieldCheck,
  ArrowRightLeft,
} from 'lucide-react';

interface ERPJournalViewProps {
  results: ReconciliationResults;
}

export const ERPJournalView: React.FC<ERPJournalViewProps> = ({ results }) => {
  const [viewFormat, setViewFormat] = useState<'GL' | 'TALLY' | 'ZOHO'>('GL');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const voucher: ERPJournalVoucher = useMemo(() => {
    return generateERPJournalVoucher(results);
  }, [results]);

  const tallyXML = useMemo(() => generateTallyXML(voucher), [voucher]);
  const zohoCSV = useMemo(() => generateZohoCSV(voucher), [voucher]);

  const handleCopy = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleDownloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click;
    URL.revokeObjectURL(url);
  };

  return (
    <div id="erp-journal-view" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
              <Building className="h-4 w-4 text-indigo-600" />
              <span>Automated Double-Entry ERP Journal Entry</span>
            </h3>
            <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
              {voucher.voucher_number}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Auto-generated accounting voucher compliant with Indian Accounting Standards (Ind AS 115) & GST Input Tax Credit rules.
          </p>
        </div>

        {/* Format Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewFormat('GL')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition ${
                viewFormat === 'GL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="h-3 w-3" />
              <span>General Ledger</span>
            </button>
            <button
              onClick={() => setViewFormat('TALLY')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition ${
                viewFormat === 'TALLY'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="h-3 w-3" />
              <span>Tally XML</span>
            </button>
            <button
              onClick={() => setViewFormat('ZOHO')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition ${
                viewFormat === 'ZOHO'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="h-3 w-3" />
              <span>Zoho Books CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Double-Entry Parity Banner */}
      <div
        className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
          voucher.is_balanced
            ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
            : 'bg-rose-50/70 border-rose-200 text-rose-800'
        }`}
      >
        <div className="flex items-center gap-2">
          {voucher.is_balanced ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">
            {voucher.is_balanced
              ? 'Double-Entry Parity Verified: 100% In Balance'
              : 'Double-Entry Imbalance Detected: Dr and Cr Mismatch'}
          </span>
          <span
            className={`text-[11px] font-mono ${
              voucher.is_balanced ? 'text-emerald-700' : 'text-rose-700 font-bold'
            }`}
          >
            (Total Dr: ₹{voucher.total_debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} {voucher.is_balanced ? '=' : '≠'} Total Cr: ₹{voucher.total_credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })})
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-slate-500">Date: {voucher.voucher_date}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">Entity: {voucher.merchant_id}</span>
          <span className="text-slate-300">•</span>
          <span
            className={`px-2 py-0.5 rounded font-bold ${
              voucher.is_balanced
                ? 'text-emerald-700 bg-emerald-100/70 border border-emerald-200'
                : 'text-rose-700 bg-rose-100/80 border border-rose-300 animate-pulse'
            }`}
          >
            Variance: ₹{voucher.variance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* View Content */}
      {viewFormat === 'GL' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] leading-tight">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-2.5 pl-4">Account Code</th>
                <th className="p-2.5">Ledger Account</th>
                <th className="p-2.5">Group</th>
                <th className="p-2.5 text-right">Debit (₹ Dr)</th>
                <th className="p-2.5 text-right">Credit (₹ Cr)</th>
                <th className="p-2.5 pr-4">Line Item Narration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {voucher.line_items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="p-2.5 pl-4 text-slate-500 font-semibold text-[10px]">
                    {item.account_code}
                  </td>
                  <td className="p-2.5 font-sans font-semibold text-slate-800">
                    {item.account_name}
                  </td>
                  <td className="p-2.5 font-sans">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        item.account_type === 'ASSET'
                          ? 'bg-blue-50 text-blue-700'
                          : item.account_type === 'EXPENSE'
                          ? 'bg-amber-50 text-amber-700'
                          : item.account_type === 'INCOME'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {item.account_type}
                    </span>
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-800">
                    {item.debit > 0 ? `₹${item.debit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-800">
                    {item.credit > 0 ? `₹${item.credit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="p-2.5 pr-4 font-sans text-slate-500 text-[10px] max-w-xs">
                    {item.narration}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-mono font-bold text-slate-900">
              <tr>
                <td colSpan={3} className="p-2.5 pl-4 uppercase text-[10px] tracking-wider text-slate-500">
                  Total Voucher Ledger:
                </td>
                <td
                  className={`p-2.5 text-right ${
                    voucher.is_balanced ? 'text-emerald-700' : 'text-slate-900 font-extrabold'
                  }`}
                >
                  ₹{voucher.total_debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td
                  className={`p-2.5 text-right ${
                    voucher.is_balanced ? 'text-emerald-700' : 'text-slate-900 font-extrabold'
                  }`}
                >
                  ₹{voucher.total_credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-2.5 pr-4 font-sans text-[10px]">
                  {voucher.is_balanced ? (
                    <span className="text-emerald-600 font-bold inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Balanced (₹0.00 Variance)
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold inline-flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Variance: ₹{voucher.variance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {viewFormat === 'TALLY' && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Tally Prime XML format. Ready to import via <strong>Alt+M ➔ Import ➔ Transactions</strong>.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(tallyXML, 'Tally XML')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
              >
                {copiedFormat === 'Tally XML' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                <span>{copiedFormat === 'Tally XML' ? 'Copied XML!' : 'Copy XML'}</span>
              </button>
              <button
                onClick={() => handleDownloadFile(tallyXML, `${voucher.voucher_number}.xml`, 'application/xml')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
              >
                <Download className="h-3.5 w-3.5 text-indigo-600" />
                <span>Download .xml</span>
              </button>
            </div>
          </div>
          <pre className="p-3.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-[10px] leading-relaxed max-h-72 overflow-y-auto border border-slate-800">
            {tallyXML}
          </pre>
        </div>
      )}

      {viewFormat === 'ZOHO' && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Zoho Books Manual Journal import format. Ready to import via <strong>Accountant ➔ Manual Journals ➔ Import</strong>.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(zohoCSV, 'Zoho CSV')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
              >
                {copiedFormat === 'Zoho CSV' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                <span>{copiedFormat === 'Zoho CSV' ? 'Copied CSV!' : 'Copy CSV'}</span>
              </button>
              <button
                onClick={() => handleDownloadFile(zohoCSV, `${voucher.voucher_number}_zoho.csv`, 'text/csv')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
              >
                <Download className="h-3.5 w-3.5 text-indigo-600" />
                <span>Download .csv</span>
              </button>
            </div>
          </div>
          <pre className="p-3.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-[10px] leading-relaxed max-h-72 overflow-y-auto border border-slate-800">
            {zohoCSV}
          </pre>
        </div>
      )}

      {/* Footer explanation note */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
          <span>Accounting Audit Note: All 2.0% Razorpay MDR + 18% GST deductions posted directly to Expense and GSTR-2B Input Tax Credit accounts.</span>
        </span>
        <span className="font-mono text-slate-400">Standard ERP Journal Generator v2.4</span>
      </div>
    </div>
  );
};
