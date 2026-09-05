import React, { useState } from 'react';
import { HonestException } from '../types';
import {
  AlertTriangle,
  X,
  Copy,
  Check,
  CheckCircle2,
  FileText,
  Mail,
  ShieldAlert,
  Download,
  Send,
  Building2,
} from 'lucide-react';

interface ActionSlipModalProps {
  exception: HonestException;
  onClose: () => void;
}

export const ActionSlipModal: React.FC<ActionSlipModalProps> = ({ exception, onClose }) => {
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [copiedSlip, setCopiedSlip] = useState(false);
  const [actionStatus, setActionStatus] = useState<'PENDING' | 'DISPATCHED_TO_OPS' | 'RESOLVED'>('PENDING');

  const isGhostOrder = exception.failure_category === 'GHOST_ORDER_DROP_OFF';
  const isBankCredit = exception.failure_category === 'UNIDENTIFIED_BANK_CREDIT';

  const slipId = `SLIP-2026-${exception.record_ref.replace(/[^A-Za-z0-9]/g, '')}`;

  // Customer communication draft for Ghost Orders
  const customerEmailDraft = `Subject: Important regarding your UrbanThread order ${exception.record_ref} - Payment Verification Required

Dear Customer,

Thank you for shopping with UrbanThread Apparel.

During our automated daily finance settlement audit, our reconciliation controller detected that while order ${exception.record_ref} (₹${exception.disputed_amount.toFixed(2)}) was initiated on our store, your payment gateway transaction was not completed or failed before reaching our settlement account.

To ensure your order is not cancelled or fulfillment delayed:
1. Please use this secure Razorpay link to re-attempt payment: https://rzp.io/l/urbanthread-retry-${exception.record_ref.toLowerCase()}
2. If your bank account has already been debited, kindly reply to this email with your Bank UTR or UPI Reference number so our Treasury team can verify and credit your order.

UrbanThread Finance & Fulfillment Team
Merchant ID: URBANTHREAD_D2C_IND`;

  // Treasury bank inquiry draft for Unidentified Bank Credits
  const bankEnquiryDraft = `To: Operations & Branch Treasury Desk, HDFC Bank Nodal Services
From: Finance Controller, UrbanThread Apparel (Merchant ID: URBANTHREAD_D2C_IND)
Date: ${new Date().toISOString().split('T')[0]}
Subject: Request for Remitter Details — Inward Credit ${exception.record_ref}

Dear Branch Operations Team,

During our automated multi-source ledger reconciliation, we detected an un-reconciled inward bank credit in our Nodal Current Account:
• Transaction Reference / Bank UTR: ${exception.record_ref}
• Credit Amount: ₹${exception.disputed_amount.toFixed(2)}
• Current Narration: ${exception.actionable_audit_diagnosis}

This inward fund transfer does not match any open or active store order in our ERP system.

Kindly furnish:
1. Remitter Customer / Entity Name
2. Originating Bank Name & IFSC
3. Remitter Account Number (masked)

Please hold this amount in Account 2190 (Unidentified Customer Deposits) pending verification.

Regards,
UrbanThread Finance Controller`;

  // Gateway dispute draft for other exceptions
  const gatewayDisputeDraft = `To: Razorpay Merchant Support & Settlements Desk
Merchant ID: URBANTHREAD_D2C_IND
Ticket Type: Settlement Mismatch & Status Discrepancy
Ref ID: ${exception.record_ref}
Disputed Amount: ₹${exception.disputed_amount.toFixed(2)}

Summary:
Automated Double-Entry Reconciliation Controller flagged record ${exception.record_ref}.
Diagnosis: ${exception.actionable_audit_diagnosis}

Action Requested:
Provide updated transaction ledger statement and UTR reference for the above batch.`;

  const activeDraft = isGhostOrder ? customerEmailDraft : isBankCredit ? bankEnquiryDraft : gatewayDisputeDraft;

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(activeDraft);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const fullSlipText = `=====================================================
RAZORRECON AUTONOMOUS FINANCE CONTROLLER: ACTION SLIP
=====================================================
Slip Reference: ${slipId}
Generated Date: ${new Date().toISOString()}
Merchant ID: URBANTHREAD_D2C_IND
Exception Category: ${exception.failure_category}
Source Layer: ${exception.source_layer}
Target Record: ${exception.record_ref}
Disputed Exposure: ₹${exception.disputed_amount.toFixed(2)}
Workflow Status: ${actionStatus}

AUDIT DIAGNOSIS:
${exception.actionable_audit_diagnosis}

OPERATIONS PROTOCOL:
${isGhostOrder ? '- Hold package dispatch in Warehouse Management System (WMS)\n- Send payment recovery notification to customer\n- Mark order as AWAITING_PAYMENT in OMS' : '- Post credit to Suspense Account 2190\n- Dispatch bank enquiry tracer memo to Nodal Bank\n- Await customer KYC / matching claim within 7 working days'}

COMMUNICATION DRAFT:
-----------------------------------------------------
${activeDraft}
=====================================================`;

  const handleCopySlip = () => {
    navigator.clipboard.writeText(fullSlipText);
    setCopiedSlip(true);
    setTimeout(() => setCopiedSlip(false), 2000);
  };

  const handleDownloadSlip = () => {
    const blob = new Blob([fullSlipText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slipId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="rounded-xl border border-slate-200 bg-white max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/40">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                  Exception Action Slip & Resolution Plan
                </h3>
                <span className="text-[10px] font-mono font-bold bg-white text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                  {slipId}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Automated containment protocol • Ref: <span className="font-mono font-semibold text-slate-700">{exception.record_ref}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Key Details Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Source Layer</p>
              <p className="font-semibold text-slate-800">{exception.source_layer}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Record Ref</p>
              <p className="font-mono font-bold text-slate-900">{exception.record_ref}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Disputed Exposure</p>
              <p className="font-bold text-rose-600 font-mono text-sm">₹{exception.disputed_amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Workflow Status</p>
              <select
                value={actionStatus}
                onChange={(e) => setActionStatus(e.target.value as any)}
                className="mt-0.5 text-[10px] font-bold rounded px-1.5 py-1 bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="PENDING">⚠️ Action Pending</option>
                <option value="DISPATCHED_TO_OPS">🚀 Dispatched to Ops</option>
                <option value="RESOLVED">✅ Resolved / Closed</option>
              </select>
            </div>
          </div>

          {/* Audit Diagnosis */}
          <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-200 text-rose-900">
            <p className="font-bold text-[11px] mb-1 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
              <span>Controller Audit Diagnosis</span>
            </p>
            <p className="text-[11px] leading-relaxed">{exception.actionable_audit_diagnosis}</p>
          </div>

          {/* Remediation Protocol */}
          <div className="rounded-lg border border-slate-200 bg-white p-3.5">
            <h4 className="font-bold text-slate-800 text-[11px] mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
              <span>Recommended Standard Operating Procedure (SOP)</span>
            </h4>
            <ul className="space-y-1.5 text-[11px] text-slate-600 list-disc list-inside">
              {isGhostOrder ? (
                <>
                  <li><strong>Warehouse Freeze:</strong> Place order <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">{exception.record_ref}</code> on Hold in Shopify / OMS to avoid shipping uncollected inventory.</li>
                  <li><strong>Payment Recovery:</strong> Issue an automated payment recovery link via WhatsApp / Email to customer.</li>
                  <li><strong>GL Accounting Entry:</strong> Post to <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">1195 - Reconciliation Suspense</code>; reverse upon confirmed payment or order cancellation.</li>
                </>
              ) : isBankCredit ? (
                <>
                  <li><strong>Treasury Isolation:</strong> Record inward bank credit of <span className="font-bold text-slate-800">₹{exception.disputed_amount.toFixed(2)}</span> in <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">2190 - Sundry Creditors (Unidentified Deposits)</code>.</li>
                  <li><strong>Bank Tracer:</strong> Transmit inquiry memo to HDFC Bank Nodal Operations with UTR <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">{exception.record_ref}</code> to ascertain remitter details.</li>
                  <li><strong>7-Day Claim Window:</strong> If unmatched after 7 working days, initiate return-to-origin refund per RBI settlement guidelines.</li>
                </>
              ) : (
                <>
                  <li><strong>Discrepancy Ticket:</strong> Dispatch dispute to Razorpay Settlements team with Payment ID <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">{exception.record_ref}</code>.</li>
                  <li><strong>Settlement Hold:</strong> Quarantine net difference in Dispute Clearing account until re-settled in subsequent payout batch.</li>
                </>
              )}
            </ul>
          </div>

          {/* Copyable Communication Template */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                {isGhostOrder ? <Mail className="h-3.5 w-3.5 text-indigo-600" /> : <Building2 className="h-3.5 w-3.5 text-indigo-600" />}
                <span className="font-bold text-slate-800 text-[11px]">
                  {isGhostOrder ? 'Draft Customer Recovery Outreach' : isBankCredit ? 'Draft Bank Tracer Memo' : 'Draft Razorpay Ticket'}
                </span>
              </div>
              <button
                onClick={handleCopyDraft}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[10px] transition"
              >
                {copiedDraft ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-400" />}
                <span>{copiedDraft ? 'Copied to Clipboard!' : 'Copy Draft'}</span>
              </button>
            </div>
            <pre className="p-3 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {activeDraft}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySlip}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition"
            >
              {copiedSlip ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              <span>{copiedSlip ? 'Slip Copied!' : 'Copy Full Action Slip'}</span>
            </button>
            <button
              onClick={handleDownloadSlip}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
            >
              <Download className="h-3.5 w-3.5 text-indigo-600" />
              <span>Download Slip (.txt)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
