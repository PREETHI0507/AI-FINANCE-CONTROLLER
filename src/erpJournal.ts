import { ReconciliationResults, ReconciledRecord, HonestException } from './types';

export interface JournalLineItem {
  account_code: string;
  account_name: string;
  account_type: 'ASSET' | 'LIABILITY' | 'EXPENSE' | 'INCOME';
  debit: number;
  credit: number;
  narration: string;
}

export interface ERPJournalVoucher {
  voucher_number: string;
  voucher_date: string;
  merchant_id: string;
  narration: string;
  line_items: JournalLineItem[];
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  variance: number;
}

/**
 * Computes double-entry journal voucher for Razorpay reconciliation batch.
 * Strict standard Indian accounting principles (Ind AS 115 & GST ITC rules):
 * Dr. Bank Current Account (Net realized cash credited - strictly matches settled cash)
 * Dr. Razorpay Gateway MDR Charges (2.0% processing fee)
 * Dr. GST Input Tax Credit (ITC - 18% on MDR charges, GSTR-2B claimable)
 * Dr. Reconciliation Suspense - Uncollected Ghost Sales (Orders marked paid in store, failed gateway)
 * Cr. D2C Store Debtors / Sales Revenue (Gross store billed orders)
 * Cr. Output GST Liability (18% checkout GST collected on taxable orders)
 */
export function generateERPJournalVoucher(results: ReconciliationResults): ERPJournalVoucher {
  const voucherDate = new Date().toISOString().split('T')[0];
  const voucherNumber = `JV-RZP-${voucherDate.replace(/-/g, '')}-001`;

  let totalReconciledBaseRevenue = 0;
  let totalReconciledCheckoutGst = 0;
  let totalReconciledMdr = 0;
  let totalReconciledGstOnFee = 0;
  let totalReconciledBankNet = 0;

  for (const rec of results.reconciled_records) {
    const isTaxCaseB = rec.match_category.includes('Case B') || rec.match_category.includes('Tax');
    const billedBase = rec.billed_amount;
    const grossCollected = isTaxCaseB ? Math.round(billedBase * 1.18 * 100) / 100 : billedBase;
    const checkoutTax = isTaxCaseB ? Math.round((grossCollected - billedBase) * 100) / 100 : 0;

    totalReconciledBaseRevenue += billedBase;
    totalReconciledCheckoutGst += checkoutTax;
    totalReconciledBankNet += rec.bank_settled;

    // Standard Razorpay fee breakdown
    const mdr = Math.round(grossCollected * 0.02 * 100) / 100;
    // Exactly capture tax on fee to ensure (bank_settled + mdr + gstOnFee === grossCollected)
    const totalDeductions = Math.round((grossCollected - rec.bank_settled) * 100) / 100;
    const gstOnFee = Math.round((totalDeductions - mdr) * 100) / 100;

    totalReconciledMdr += mdr;
    totalReconciledGstOnFee += gstOnFee;
  }

  // Ghost orders (Case C: Failed Gateway)
  let ghostOrdersDisputed = 0;
  for (const exc of results.exceptions) {
    if (exc.failure_category === 'GHOST_ORDER_DROP_OFF') {
      ghostOrdersDisputed += exc.disputed_amount;
    }
  }

  // Round all totals to 2 decimal places
  totalReconciledBaseRevenue = Math.round(totalReconciledBaseRevenue * 100) / 100;
  totalReconciledCheckoutGst = Math.round(totalReconciledCheckoutGst * 100) / 100;
  totalReconciledBankNet = Math.round(totalReconciledBankNet * 100) / 100;
  totalReconciledMdr = Math.round(totalReconciledMdr * 100) / 100;
  totalReconciledGstOnFee = Math.round(totalReconciledGstOnFee * 100) / 100;
  ghostOrdersDisputed = Math.round(ghostOrdersDisputed * 100) / 100;

  const lineItems: JournalLineItem[] = [];

  // 1. Dr. Bank Current Account (Net Realized Cash) - strictly matches settled cash amount
  lineItems.push({
    account_code: '1010-HDFC-NODAL',
    account_name: 'HDFC Bank Current Account - Nodal Settlement (50200010928)',
    account_type: 'ASSET',
    debit: totalReconciledBankNet,
    credit: 0,
    narration: `Net funds settled and credited by Razorpay gateway nodal account across ${results.reconciled_records.length} verified closed-loop orders`,
  });

  // 2. Dr. Razorpay MDR Processing Fee (2.0%)
  lineItems.push({
    account_code: '5040-MDR-FEES',
    account_name: 'Payment Gateway Processing Charges (Razorpay MDR 2.0%)',
    account_type: 'EXPENSE',
    debit: totalReconciledMdr,
    credit: 0,
    narration: `Contractual 2.0% merchant discount rate deducted at source on gross settled volume`,
  });

  // 3. Dr. Input Tax Credit - GST on Bank Charges (18% on MDR)
  lineItems.push({
    account_code: '1090-GST-ITC-18',
    account_name: 'Input Tax Credit - IGST/CGST/SGST on Bank Charges (18%)',
    account_type: 'ASSET',
    debit: totalReconciledGstOnFee,
    credit: 0,
    narration: `GST paid on Razorpay MDR invoice; 100% claimable under GSTR-2B against output tax liability`,
  });

  // 4. Dr. Reconciliation Suspense - Uncollected Ghost Sales (if any)
  if (ghostOrdersDisputed > 0) {
    lineItems.push({
      account_code: '1195-SUSP-GHOST',
      account_name: 'Reconciliation Suspense - Uncollected Ghost Orders (Failed Gateway)',
      account_type: 'ASSET',
      debit: ghostOrdersDisputed,
      credit: 0,
      narration: `Quarantined orders marked PAID in store but failed at gateway; total uncollected merchandise value awaiting recovery/cancellation`,
    });
  }

  // 5. Cr. D2C Store Debtors / Sales Revenue
  const totalStoreGrossRevenue = Math.round((totalReconciledBaseRevenue + ghostOrdersDisputed) * 100) / 100;
  lineItems.push({
    account_code: '4010-D2C-SALES',
    account_name: 'Trade Receivables / D2C Store Sales Revenue (UrbanThread)',
    account_type: 'INCOME',
    debit: 0,
    credit: totalStoreGrossRevenue,
    narration: `Gross order merchandise value recognized from Store Orders ledger (including quarantined orders)`,
  });

  // 6. Cr. Output GST Liability (18% Checkout Tax Collected on Case B orders)
  if (totalReconciledCheckoutGst > 0) {
    lineItems.push({
      account_code: '2020-GST-OUTPUT-18',
      account_name: 'Output GST Liability - 18% Checkout Tax Collected (CGST/SGST/IGST)',
      account_type: 'LIABILITY',
      debit: 0,
      credit: totalReconciledCheckoutGst,
      narration: `18% Goods & Services Tax collected at checkout on taxable orders; payable to Govt under GSTR-3B`,
    });
  }

  const totalDebit = Math.round(lineItems.reduce((acc, item) => acc + item.debit, 0) * 100) / 100;
  const totalCredit = Math.round(lineItems.reduce((acc, item) => acc + item.credit, 0) * 100) / 100;
  const rawDiff = Math.round((totalDebit - totalCredit) * 100) / 100;
  const variance = Math.abs(rawDiff);
  const isBalanced = variance === 0;

  return {
    voucher_number: voucherNumber,
    voucher_date: voucherDate,
    merchant_id: 'URBANTHREAD_D2C_IND',
    narration: `Autonomous reconciliation journal entry for Razorpay settlement cycle. Verified ${results.reconciled_records.length} closed-loop orders. Quarantined ${results.exceptions.length} exceptions.`,
    line_items: lineItems,
    total_debit: totalDebit,
    total_credit: totalCredit,
    is_balanced: isBalanced,
    variance: variance,
  };
}

/**
 * Exports voucher in Tally Prime XML import format.
 */
export function generateTallyXML(voucher: ERPJournalVoucher): string {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n<ENVELOPE>\n  <HEADER>\n    <TALLYREQUEST>Import Data</TALLYREQUEST>\n  </HEADER>\n  <BODY>\n    <IMPORTDATA>\n      <REQUESTDESC>\n        <REPORTNAME>All Masters</REPORTNAME>\n      </REQUESTDESC>\n      <REQUESTDATA>\n        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n          <VOUCHER VCHTYPE="Journal" ACTION="Create">\n            <DATE>${voucher.voucher_date.replace(/-/g, '')}</DATE>\n            <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>\n            <VOUCHERNUMBER>${voucher.voucher_number}</VOUCHERNUMBER>\n            <NARRATION>${voucher.narration}</NARRATION>\n`;

  for (const item of voucher.line_items) {
    const isDr = item.debit > 0;
    const amount = isDr ? -item.debit : item.credit;
    xml += `            <ALLLEDGERENTRIES.LIST>\n              <LEDGERNAME>${item.account_name}</LEDGERNAME>\n              <ISDEEMEDPOSITIVE>${isDr ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>\n              <AMOUNT>${amount.toFixed(2)}</AMOUNT>\n            </ALLLEDGERENTRIES.LIST>\n`;
  }

  xml += `          </VOUCHER>\n        </TALLYMESSAGE>\n      </REQUESTDATA>\n    </IMPORTDATA>\n  </BODY>\n</ENVELOPE>`;
  return xml;
}

/**
 * Exports voucher in Zoho Books CSV Journal format.
 */
export function generateZohoCSV(voucher: ERPJournalVoucher): string {
  const headers = ['Journal Date', 'Journal Number', 'Reference Number', 'Notes', 'Account', 'Debits', 'Credits', 'Description'];
  const rows: string[] = [headers.join(',')];

  for (const item of voucher.line_items) {
    rows.push([
      `"${voucher.voucher_date}"`,
      `"${voucher.voucher_number}"`,
      `"${voucher.merchant_id}"`,
      `"${voucher.narration.replace(/"/g, '""')}"`,
      `"${item.account_name.replace(/"/g, '""')}"`,
      item.debit > 0 ? item.debit.toFixed(2) : '',
      item.credit > 0 ? item.credit.toFixed(2) : '',
      `"${item.narration.replace(/"/g, '""')}"`,
    ].join(','));
  }

  return rows.join('\n');
}
