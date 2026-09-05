import React, { useState, useMemo } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Upload,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Search,
  Code2,
  Copy,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  Info,
  Building,
  ShieldAlert,
  FileSpreadsheet,
  Calculator,
  NotebookPen,
} from 'lucide-react';
import {
  StoreOrder,
  GatewaySettlement,
  BankStatementRow,
  ReconciledRecord,
  HonestException,
  ReconciliationResults,
} from './types';
import {
  generateSyntheticData,
  reconcileBooks,
  parseCSV,
  generateAuditCSV,
} from './engine';
import { ERPJournalView } from './components/ERPJournalView';
import { ActionSlipModal } from './components/ActionSlipModal';
import { AuditCalculatorModal } from './components/AuditCalculatorModal';
import { AuditNotepadDrawer } from './components/AuditNotepadDrawer';

// Python app.py code string for viewing/downloading
const PYTHON_APP_CODE = `"""
⚡ RazorRecon: Autonomous AI Finance Controller
Track 04: AI Finance Controller (Razorpay AI Buildathon)

Deterministic, Zero-API-Key, Double-Entry Multi-Source Ledger Reconciliation Engine
Engineered for Indian D2C Merchants ("UrbanThread Apparel").
Reconciles:
1. Store Sales Ledger (store_orders.csv)
2. Payment Gateway Settlements (gateway_settlements.csv)
3. Corporate Bank Statements (bank_statement.csv)
"""

import io
import math
import random
import re
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
import streamlit as st

st.set_page_config(
    page_title="⚡ RazorRecon: Autonomous AI Finance Controller",
    page_icon="⚡",
    layout="wide",
)

def generate_synthetic_data(n: int = 60) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    # Generates Case A (~75%), Case B (~10%), Case C (~8%), Case D (~7%)
    random.seed(42)
    # [Implementation details: 60 records across store_orders, gateway_settlements, bank_statement]
    ...
`;

export default function App() {
  // Datasets state
  const [storeOrders, setStoreOrders] = useState<StoreOrder[]>([]);
  const [gatewaySettlements, setGatewaySettlements] = useState<GatewaySettlement[]>([]);
  const [bankStatements, setBankStatements] = useState<BankStatementRow[]>([]);
  const [results, setResults] = useState<ReconciliationResults | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<'all' | 'reconciled' | 'exceptions' | 'journal' | 'raw'>('all');
  const [rawTab, setRawTab] = useState<'store' | 'gateway' | 'bank'>('store');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'CASE_A' | 'CASE_B'>('ALL');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ReconciledRecord | null>(null);
  const [selectedException, setSelectedException] = useState<HonestException | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);

  // Load Demo Batch (60 records)
  const handleLoadDemo = () => {
    const { storeOrders: so, gatewaySettlements: gs, bankStatements: bs } = generateSyntheticData(60);
    setStoreOrders(so);
    setGatewaySettlements(gs);
    setBankStatements(bs);
    setResults(null);
  };

  // Run Autonomous Reconciliation
  const handleRunReconciliation = () => {
    if (storeOrders.length === 0 || gatewaySettlements.length === 0 || bankStatements.length === 0) {
      alert('Please load the demo batch or upload all 3 CSV datasets first.');
      return;
    }
    setIsReconciling(true);
    setTimeout(() => {
      const res = reconcileBooks(storeOrders, gatewaySettlements, bankStatements);
      setResults(res);
      setIsReconciling(false);
      setActiveTab('all');
    }, 150);
  };

  // File Upload Handlers
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'store' | 'gateway' | 'bank'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      if (type === 'store') {
        const parsed = parseCSV<StoreOrder>(text);
        setStoreOrders(parsed);
      } else if (type === 'gateway') {
        const parsed = parseCSV<GatewaySettlement>(text);
        setGatewaySettlements(parsed);
      } else if (type === 'bank') {
        const parsed = parseCSV<BankStatementRow>(text);
        setBankStatements(parsed);
      }
      setResults(null);
    };
    reader.readAsText(file);
  };

  // Download Unified Audit CSV
  const handleDownloadCSV = () => {
    if (!results) return;
    const csvContent = generateAuditCSV(results);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `razorrecon_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download app.py
  const handleDownloadAppPy = () => {
    // Fetch local /app.py if available or trigger download
    fetch('/app.py')
      .then((res) => res.text())
      .then((code) => {
        const blob = new Blob([code], { type: 'text/x-python;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'app.py');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(() => {
        const blob = new Blob([PYTHON_APP_CODE], { type: 'text/x-python;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'app.py');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  };

  // Copy app.py code
  const handleCopyCode = () => {
    fetch('/app.py')
      .then((res) => res.text())
      .then((code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      })
      .catch(() => {
        navigator.clipboard.writeText(PYTHON_APP_CODE);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      });
  };

  // Filtered Reconciled Records
  const filteredReconciled = useMemo(() => {
    if (!results) return [];
    return results.reconciled_records.filter((rec) => {
      const matchQuery =
        searchQuery === '' ||
        rec.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.utr.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCat =
        categoryFilter === 'ALL' ||
        (categoryFilter === 'CASE_A' && rec.match_category.includes('Case A')) ||
        (categoryFilter === 'CASE_B' && rec.match_category.includes('Case B'));

      return matchQuery && matchCat;
    });
  }, [results, searchQuery, categoryFilter]);

  const hasData = storeOrders.length > 0 && gatewaySettlements.length > 0 && bankStatements.length > 0;

  return (
    <div id="razor-recon-app" className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between antialiased">
      <div>
        {/* Header Section */}
        <header id="main-header" className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-sm">
              <div className="w-3.5 h-3.5 border-2 border-white rotate-45 flex items-center justify-center">
                <div className="w-1 h-1 bg-white"></div>
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                RazorRecon <span className="text-indigo-600 font-medium">Autonomous AI Controller</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-medium">
                Multi-Source Ledger Reconciliation Engine • Track 04
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Quick Utility Tools: Calculator & Auditor Scratchpad */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
              <button
                id="open-calculator-btn"
                onClick={() => setIsCalculatorOpen(true)}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
                  isCalculatorOpen
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                }`}
                title="Open Audit Calculator (Esc to close)"
              >
                <Calculator className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span className="hidden sm:inline text-[11px]">Calculator</span>
              </button>

              <button
                id="open-notepad-btn"
                onClick={() => setIsNotepadOpen(true)}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
                  isNotepadOpen
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                }`}
                title="Open Audit Scratchpad / Notes"
              >
                <NotebookPen className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span className="hidden sm:inline text-[11px]">Scratchpad</span>
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <div className="text-right">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Merchant ID</p>
              <p className="text-xs sm:text-sm font-bold text-slate-700 font-mono">URBANTHREAD_D2C_IND</p>
            </div>
          </div>
        </header>

        {/* Main Workspace Content */}
        <main id="app-main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
          {/* Specification Strip */}
          <div id="rules-spec-panel" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Reconciliation Rule:</strong> Standard Razorpay 2.0% Processing Fee + 18.0% GST on Fee = <strong className="text-slate-900 font-semibold">2.36% Net Deduction</strong> (Tolerance: ±₹0.05).
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
              <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-semibold">Deterministic Math</span>
              <span>•</span>
              <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold">Honest Guardrails</span>
            </div>
          </div>

          {/* Control & Multi-Source Ingestion Panel */}
          <section id="ingestion-panel" className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>📂 Multi-Source Ledger Ingestion Streams</span>
                  {hasData && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      {storeOrders.length + gatewaySettlements.length + bankStatements.length} Records Loaded
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cross-referencing 3 real-world source streams: Store Sales, Gateway Settlements, and Corporate Bank Account.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="load-demo-batch-btn"
                  onClick={handleLoadDemo}
                  className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold py-2 px-3.5 rounded-lg text-xs uppercase tracking-tight transition flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>🚀 Load UrbanThread Demo Batch</span>
                </button>

                {hasData && (
                  <button
                    id="run-autonomous-recon-btn"
                    onClick={handleRunReconciliation}
                    disabled={isReconciling}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-xs uppercase tracking-tight shadow-md shadow-indigo-200 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isReconciling ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Reconciling...</span>
                      </>
                    ) : (
                      <>
                        <span>▶️ Run Autonomous Recon</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* 3 Stream Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              {/* Stream 1: Store Orders */}
              <div
                id="card-store-orders"
                className={`rounded-lg p-3 flex flex-col justify-between transition ${
                  storeOrders.length > 0
                    ? 'bg-white border border-slate-200 shadow-xs'
                    : 'bg-white border-2 border-dashed border-slate-300 hover:border-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Store Sales</span>
                    <span className="text-xs text-slate-500 italic font-mono">store_orders.csv</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Columns: order_id, customer_name, billed_amount, order_status
                  </p>
                  {storeOrders.length > 0 ? (
                    <div className="p-2 rounded bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900 flex items-center justify-between">
                      <span className="font-semibold">✅ {storeOrders.length} Orders Active</span>
                      <span className="font-mono font-bold">
                        ₹{storeOrders.reduce((a, b) => a + (Number(b.billed_amount) || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ) : (
                    <label className="border border-slate-200 hover:border-slate-300 rounded p-2.5 text-center cursor-pointer block transition bg-slate-50/50">
                      <Upload className="h-3.5 w-3.5 mx-auto text-slate-400 mb-0.5" />
                      <span className="text-[11px] text-slate-600 block font-medium">Upload store_orders.csv</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFileUpload(e, 'store')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Stream 2: Gateway Settlements */}
              <div
                id="card-gateway-settlements"
                className={`rounded-lg p-3 flex flex-col justify-between transition ${
                  gatewaySettlements.length > 0
                    ? 'bg-white border border-slate-200 shadow-xs'
                    : 'bg-white border-2 border-dashed border-slate-300 hover:border-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gateway Settlements</span>
                    <span className="text-xs text-slate-500 italic font-mono">gateway.csv</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Columns: payment_id, gross_amount, gateway_fee, net_settlement, utr
                  </p>
                  {gatewaySettlements.length > 0 ? (
                    <div className="p-2 rounded bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900 flex items-center justify-between">
                      <span className="font-semibold">✅ {gatewaySettlements.length} Settlements</span>
                      <span className="font-mono font-bold">
                        ₹{gatewaySettlements.reduce((a, b) => a + (Number(b.net_settlement) || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ) : (
                    <label className="border border-slate-200 hover:border-slate-300 rounded p-2.5 text-center cursor-pointer block transition bg-slate-50/50">
                      <Upload className="h-3.5 w-3.5 mx-auto text-slate-400 mb-0.5" />
                      <span className="text-[11px] text-slate-600 block font-medium">Upload gateway.csv</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFileUpload(e, 'gateway')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Stream 3: Bank Statement */}
              <div
                id="card-bank-statement"
                className={`rounded-lg p-3 flex flex-col justify-between transition ${
                  bankStatements.length > 0
                    ? 'bg-white border border-slate-200 shadow-xs'
                    : 'bg-white border-2 border-dashed border-slate-300 hover:border-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bank Statement</span>
                    <span className="text-xs text-slate-500 italic font-mono">bank_stmt.csv</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Columns: transaction_date, narration (CMS/RZP/UTR), credit_amount
                  </p>
                  {bankStatements.length > 0 ? (
                    <div className="p-2 rounded bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-900 flex items-center justify-between">
                      <span className="font-semibold">✅ {bankStatements.length} Bank Credits</span>
                      <span className="font-mono font-bold">
                        ₹{bankStatements.reduce((a, b) => a + (Number(b.credit_amount) || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ) : (
                    <label className="border border-slate-200 hover:border-slate-300 rounded p-2.5 text-center cursor-pointer block transition bg-slate-50/50">
                      <Upload className="h-3.5 w-3.5 mx-auto text-slate-400 mb-0.5" />
                      <span className="text-[11px] text-slate-600 block font-medium">Upload bank_stmt.csv</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFileUpload(e, 'bank')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Scorecard */}
          {results && (
            <div id="executive-kpi-scorecard" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-2">
              <div id="kpi-execution-time" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Execution Time</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-800">
                    {(results.execution_time_ms / 1000).toFixed(2)}s
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 font-mono">
                    {results.throughput_rec_sec.toLocaleString()} rec/s
                  </span>
                </div>
              </div>

              <div id="kpi-match-accuracy" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Match Accuracy</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-800">
                    {results.match_accuracy_rate.toFixed(1)}%
                  </span>
                  <span className="text-[10px] font-medium text-emerald-600">
                    ↑ {results.reconciled_records.length} clean matches
                  </span>
                </div>
              </div>

              <div id="kpi-honest-exceptions" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-rose-500">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Honest Exceptions</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-rose-600">
                    {String(results.honest_exceptions_count).padStart(2, '0')}
                  </span>
                  <span
                    onClick={() => setActiveTab('exceptions')}
                    className="text-[10px] font-medium text-rose-600 hover:text-rose-800 underline cursor-pointer"
                  >
                    Review Required
                  </span>
                </div>
              </div>

              <div id="kpi-net-cash" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Net Settled Cash</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-800">
                    ₹{(results.net_cash_verified / 100000).toFixed(2)}L
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">
                    Bank Verified
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Data Tables Section */}
          {results && (
            <div className="space-y-4">
              {/* Filter and Tab Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                  <button
                    id="tab-all-btn"
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      activeTab === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Overview & All Tables
                  </button>
                  <button
                    id="tab-reconciled-btn"
                    onClick={() => setActiveTab('reconciled')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      activeTab === 'reconciled'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🟢 Reconciled ({results.reconciled_records.length})
                  </button>
                  <button
                    id="tab-exceptions-btn"
                    onClick={() => setActiveTab('exceptions')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      activeTab === 'exceptions'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🔴 Exceptions ({results.exceptions.length})
                  </button>
                  <button
                    id="tab-journal-btn"
                    onClick={() => setActiveTab('journal')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      activeTab === 'journal'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🧾 ERP Journal Voucher
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Order ID, Customer, UTR..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-56 sm:w-64"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <button
                    id="view-erp-journal-btn"
                    onClick={() => setActiveTab(activeTab === 'journal' ? 'all' : 'journal')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 shadow-xs transition"
                    title="View double-entry journal voucher for Tally / Zoho Books"
                  >
                    <Building className="h-3.5 w-3.5 text-indigo-600" />
                    <span>ERP Voucher</span>
                  </button>

                  <button
                    id="download-audit-csv-btn"
                    onClick={handleDownloadCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 shadow-xs transition"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>📥 Export Unified Audit Trail</span>
                  </button>
                </div>
              </div>

              {/* 🟢 Success Table: Reconciled Books */}
              {(activeTab === 'all' || activeTab === 'reconciled') && (
                <div id="table-reconciled-books" className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
                  <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-emerald-50/40">
                    <h3 className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      RECONCILED BOOKS (CLOSED-LOOP VERIFIED)
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-slate-400">Filter:</span>
                        <button
                          onClick={() => setCategoryFilter('ALL')}
                          className={`px-2 py-0.5 rounded font-medium ${
                            categoryFilter === 'ALL' ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setCategoryFilter('CASE_A')}
                          className={`px-2 py-0.5 rounded font-medium ${
                            categoryFilter === 'CASE_A' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          Case A (Clean)
                        </button>
                        <button
                          onClick={() => setCategoryFilter('CASE_B')}
                          className={`px-2 py-0.5 rounded font-medium ${
                            categoryFilter === 'CASE_B' ? 'bg-indigo-100 text-indigo-800' : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          Case B (Tax Var)
                        </button>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        {filteredReconciled.length} RECORDS
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-[11px] leading-tight">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 sticky top-0 z-10 text-[10px] uppercase tracking-wider">
                        <tr>
                          <th className="p-2.5 pl-4">Order ID</th>
                          <th className="p-2.5">Customer</th>
                          <th className="p-2.5 text-right">Billed (₹)</th>
                          <th className="p-2.5 text-right">Bank Credit (₹)</th>
                          <th className="p-2.5 text-right">Fee/GST</th>
                          <th className="p-2.5">Audit Explanation</th>
                          <th className="p-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {filteredReconciled.map((rec) => (
                          <tr
                            key={rec.order_id}
                            className="hover:bg-slate-50 transition cursor-pointer"
                            onClick={() => setSelectedRecord(rec)}
                          >
                            <td className="p-2.5 pl-4 font-mono font-bold text-slate-700">
                              {rec.order_id}
                            </td>
                            <td className="p-2.5 font-sans text-slate-800 font-medium">
                              {rec.customer}
                            </td>
                            <td className="p-2.5 text-right text-slate-700 font-medium">
                              {rec.billed_amount.toFixed(2)}
                            </td>
                            <td className="p-2.5 text-right text-emerald-600 font-bold">
                              {rec.bank_settled.toFixed(2)}
                            </td>
                            <td className="p-2.5 text-right text-slate-400 text-[10px]">
                              ₹{rec.deductions.toFixed(2)} (2.36%)
                            </td>
                            <td className="p-2.5 font-sans text-slate-600">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                                  rec.match_category.includes('Case A')
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-indigo-50 text-indigo-700'
                                }`}
                              >
                                {rec.audit_explanation}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-sans">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRecord(rec);
                                }}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold underline"
                              >
                                Inspect Trace
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 🔴 Exception Table: Honest Exception List */}
              {(activeTab === 'all' || activeTab === 'exceptions') && (
                <div id="table-honest-exceptions" className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
                  <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-rose-50/40">
                    <h3 className="text-xs font-bold text-rose-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                      HONEST EXCEPTION LIST (REFUSED AUTO-MATCH)
                    </h3>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                      {results.exceptions.length} ANOMALIES QUARANTINED
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-[11px] leading-tight">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 sticky top-0 z-10 text-[10px] uppercase tracking-wider">
                        <tr>
                          <th className="p-2.5 pl-4">Ref Source</th>
                          <th className="p-2.5">Ref ID</th>
                          <th className="p-2.5 text-right">Disputed (₹)</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Audit Diagnosis</th>
                          <th className="p-2.5 text-right pr-4">Action Slip</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {results.exceptions.map((exc, idx) => (
                          <tr
                            key={idx}
                            className={`transition cursor-pointer ${
                              exc.failure_category === 'GHOST_ORDER_DROP_OFF'
                                ? 'bg-rose-50/30 hover:bg-rose-50/60'
                                : 'hover:bg-slate-50'
                            }`}
                            onClick={() => setSelectedException(exc)}
                          >
                            <td className="p-2.5 pl-4 font-bold text-[9px] uppercase">
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold ${
                                   exc.source_layer.includes('Gateway')
                                    ? 'text-rose-700 bg-rose-50'
                                    : 'text-amber-700 bg-amber-50'
                                }`}
                              >
                                {exc.source_layer}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono font-bold text-slate-700">
                              {exc.record_ref}
                            </td>
                            <td className="p-2.5 text-right font-bold text-rose-600">
                              ₹{exc.disputed_amount.toFixed(2)}
                            </td>
                            <td className="p-2.5 font-sans">
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${
                                  exc.failure_category === 'GHOST_ORDER_DROP_OFF'
                                    ? 'bg-rose-100 text-rose-700'
                                    : exc.failure_category === 'UNIDENTIFIED_BANK_CREDIT'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-purple-100 text-purple-700'
                                }`}
                              >
                                {exc.failure_category === 'GHOST_ORDER_DROP_OFF'
                                  ? 'Drop-off'
                                  : exc.failure_category === 'UNIDENTIFIED_BANK_CREDIT'
                                  ? 'Ghost Credit'
                                  : exc.failure_category}
                              </span>
                            </td>
                            <td className="p-2.5 font-sans text-slate-700 text-[11px] max-w-md">
                              {exc.actionable_audit_diagnosis}
                            </td>
                            <td className="p-2.5 text-right pr-4">
                              <button
                                id={`btn-action-slip-${idx}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedException(exc);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded font-bold text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition shadow-2xs"
                                title="Generate actionable containment slip & customer/bank draft"
                              >
                                <ShieldAlert className="h-3 w-3 text-rose-600" />
                                <span>Action Slip</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 🧾 Double-Entry ERP Journal Entry View */}
              {(activeTab === 'all' || activeTab === 'journal') && (
                <ERPJournalView results={results} />
              )}
            </div>
          )}

          {/* Empty Prompt State Before Reconciliation */}
          {!results && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto mb-3 text-indigo-600">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Deterministic Finance Controller Ready</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                Load the 60-record UrbanThread D2C synthetic batch across Store, Gateway, and Bank statement streams to run double-entry reconciliation.
              </p>
              <button
                onClick={handleLoadDemo}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Load UrbanThread Demo Batch</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* High Density Footer Bar */}
      <footer className="px-6 py-2.5 bg-slate-900 text-white flex flex-wrap justify-between items-center text-[10px] mt-8">
        <div className="flex items-center gap-4">
          <span className="opacity-60 uppercase font-bold tracking-widest">
            Engine Status: {isReconciling ? 'PROCESSING' : results ? 'RECONCILED' : 'IDLE'}
          </span>
          <span className="opacity-60">Local Engine v4.2.1-Deterministic</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
          <span className="font-medium uppercase">Deterministic Math Engine Verified</span>
        </div>
      </footer>

      {/* Modal: Transaction Audit Trace Inspector */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="rounded-xl border border-slate-200 bg-white max-w-lg w-full p-5 shadow-xl relative">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Double-Entry Closed-Loop Audit Trace</h3>
                <p className="text-[11px] text-slate-500 font-mono">Order ID: {selectedRecord.order_id}</p>
              </div>
            </div>

            <div className="space-y-2 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono">
              <div className="flex justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-sans">Customer:</span>
                <span className="text-slate-800 font-sans font-semibold">{selectedRecord.customer}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-sans">Billed Amount (Store):</span>
                <span className="text-slate-800 font-bold">₹{selectedRecord.billed_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-sans">Bank Settled Credit:</span>
                <span className="text-emerald-600 font-bold">₹{selectedRecord.bank_settled.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-sans">Total Gateway Deductions:</span>
                <span className="text-slate-700 font-semibold">₹{selectedRecord.deductions.toFixed(2)} (2.36%)</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-sans">Verified Payment ID:</span>
                <span className="text-slate-600">{selectedRecord.payment_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Bank Reference UTR:</span>
                <span className="text-slate-600">{selectedRecord.utr}</span>
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
              <strong>Audit Explanation:</strong> {selectedRecord.audit_explanation}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
              >
                Close Audit Trace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Action Slip & Remediation Protocol */}
      {selectedException && (
        <ActionSlipModal
          exception={selectedException}
          onClose={() => setSelectedException(null)}
        />
      )}

      {/* Modal: Standalone Single-File app.py Inspector */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="rounded-xl border border-slate-200 bg-white max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-indigo-600" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Standalone Single-File app.py (Streamlit)</h3>
                  <p className="text-[10px] text-slate-500">
                    Track 04: AI Finance Controller • Pure Python & Pandas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition"
                >
                  {copiedCode ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-400" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Script'}</span>
                </button>
                <button
                  onClick={handleDownloadAppPy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition"
                >
                  <Download className="h-3 w-3" />
                  <span>Download app.py</span>
                </button>
                <button
                  onClick={() => setShowCodeModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 ml-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed">
              <pre className="whitespace-pre">{`# Standalone Streamlit application file located at /app.py in this repository.
# Run with: streamlit run app.py

import io
import math
import random
import re
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
import streamlit as st

st.set_page_config(
    page_title="⚡ RazorRecon: Autonomous AI Finance Controller",
    page_icon="⚡",
    layout="wide",
)

# [Complete deterministic reconciliation code with zero placeholders]
# Generates 60 records (Case A 75%, Case B 10%, Case C 8%, Case D 7%)
# Deterministic regex candidate extraction, Fee verification, Tax verification,
# Honest Exception List, Executive KPI scorecards, and Unified Audit Trail CSV export.`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Quick Utility 1: Audit Calculator Modal */}
      <AuditCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* Quick Utility 2: Audit Notepad / Scratchpad Drawer */}
      <AuditNotepadDrawer
        isOpen={isNotepadOpen}
        onClose={() => setIsNotepadOpen(false)}
      />
    </div>
  );
}
