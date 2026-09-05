import {
  StoreOrder,
  GatewaySettlement,
  BankStatementRow,
  ReconciledRecord,
  HonestException,
  ReconciliationResults,
} from './types';

const FEE_RATE = 0.02;
const GST_ON_FEE_RATE = 0.18;
const TOTAL_DEDUCTION_RATE = FEE_RATE + FEE_RATE * GST_ON_FEE_RATE; // 0.0236
const NET_FACTOR = 1.0 - TOTAL_DEDUCTION_RATE; // 0.9764
const TOLERANCE = 0.05;

/**
 * Generates 60 synthetic records adhering to Case A (~75%), Case B (~10%), Case C (~8%), Case D (~7%).
 */
export function generateSyntheticData(n: number = 60): {
  storeOrders: StoreOrder[];
  gatewaySettlements: GatewaySettlement[];
  bankStatements: BankStatementRow[];
} {
  const names = [
    'Aarav Sharma', 'Priya Patel', 'Rohan Verma', 'Ananya Iyer', 'Vikram Malhotra',
    'Neha Gupta', 'Aditya Nair', 'Sneha Reddy', 'Kabir Sen', 'Pooja Deshmukh',
    'Siddharth Rao', 'Tanvi Joshi', 'Arjun Mehta', 'Ishita Saxena', 'Karan Kapoor',
    'Divya Nambiar', 'Rahul Choudhury', 'Meera Kulkarni', 'Gaurav Bhatt', 'Shreya Das',
  ];
  const paymentMethods = ['UPI', 'Credit Card', 'NetBanking', 'Debit Card'];

  const storeOrders: StoreOrder[] = [];
  const gatewaySettlements: GatewaySettlement[] = [];
  const bankStatements: BankStatementRow[] = [];

  let currentOrderNum = 1001;

  // CASE A (~75%): 45 Clean Matches
  for (let i = 0; i < 45; i++) {
    const orderId = `ORD-${currentOrderNum}`;
    const day = (i % 25) + 1;
    const dateStr = `2025-04-${day.toString().padStart(2, '0')}`;
    const customer = names[i % names.length];
    const billedAmt = [999.0, 1499.0, 1999.0, 2499.0, 3999.0, 4999.0][i % 6];
    const method = paymentMethods[i % paymentMethods.length];

    const gatewayFee = Math.round(billedAmt * 0.02 * 100) / 100;
    const taxOnFee = Math.round(gatewayFee * 0.18 * 100) / 100;
    const netSettlement = Math.round((billedAmt - (gatewayFee + taxOnFee)) * 100) / 100;
    const utr = `UTR${8829000 + i}`;
    const paymentId = `pay_RZP${50000 + i}`;

    storeOrders.push({
      order_id: orderId,
      order_date: dateStr,
      customer_name: customer,
      billed_amount: billedAmt,
      payment_method: method,
      order_status: 'PAID',
    });

    gatewaySettlements.push({
      payment_id: paymentId,
      order_id_ref: orderId,
      gross_amount: billedAmt,
      gateway_fee: gatewayFee,
      tax_on_fee: taxOnFee,
      net_settlement: netSettlement,
      settlement_status: 'SETTLED',
      utr_reference: utr,
    });

    const narrations = [
      `CMS/RZP/${utr}/${orderId}`,
      `RAZORPAY SETTLEMENT ${utr} REF ${orderId.replace('-', '')}`,
      `NEFT-RZPAY-NODAL-${utr}-URBANTHREAD-${orderId}`,
      `INW-RZP-${utr}-${orderId}/SETTLE`,
    ];
    bankStatements.push({
      transaction_date: dateStr,
      narration: narrations[i % narrations.length],
      credit_amount: netSettlement,
      bank_utr: utr,
    });

    currentOrderNum++;
  }

  // CASE B (~10%): 6 Checkout Tax Variances
  for (let i = 0; i < 6; i++) {
    const orderId = `ORD-${currentOrderNum}`;
    const day = (i % 25) + 1;
    const dateStr = `2025-04-${day.toString().padStart(2, '0')}`;
    const customer = names[(i + 5) % names.length];
    const baseAmt = [1000.0, 2000.0, 3000.0, 5000.0][i % 4];
    const method = paymentMethods[i % paymentMethods.length];

    const grossCollected = Math.round(baseAmt * 1.18 * 100) / 100;
    const gatewayFee = Math.round(grossCollected * 0.02 * 100) / 100;
    const taxOnFee = Math.round(gatewayFee * 0.18 * 100) / 100;
    const netSettlement = Math.round((grossCollected - (gatewayFee + taxOnFee)) * 100) / 100;
    const utr = `UTR${8939000 + i}`;
    const paymentId = `pay_RZP${60000 + i}`;

    storeOrders.push({
      order_id: orderId,
      order_date: dateStr,
      customer_name: customer,
      billed_amount: baseAmt, // Base price recorded
      payment_method: method,
      order_status: 'PAID',
    });

    gatewaySettlements.push({
      payment_id: paymentId,
      order_id_ref: orderId,
      gross_amount: grossCollected,
      gateway_fee: gatewayFee,
      tax_on_fee: taxOnFee,
      net_settlement: netSettlement,
      settlement_status: 'SETTLED',
      utr_reference: utr,
    });

    bankStatements.push({
      transaction_date: dateStr,
      narration: `CMS/RZP/${utr}/${orderId}/GST_CHECKOUT`,
      credit_amount: netSettlement,
      bank_utr: utr,
    });

    currentOrderNum++;
  }

  // CASE C (~8%): 5 Ghost Orders / Drop-offs
  for (let i = 0; i < 5; i++) {
    const orderId = `ORD-${currentOrderNum}`;
    const day = (i % 25) + 1;
    const dateStr = `2025-04-${day.toString().padStart(2, '0')}`;
    const customer = names[(i + 10) % names.length];
    const billedAmt = [1200.0, 2800.0, 3500.0, 5600.0, 1850.0][i % 5];
    const paymentId = `pay_RZP${70000 + i}`;

    storeOrders.push({
      order_id: orderId,
      order_date: dateStr,
      customer_name: customer,
      billed_amount: billedAmt,
      payment_method: 'UPI',
      order_status: 'PAID',
    });

    gatewaySettlements.push({
      payment_id: paymentId,
      order_id_ref: orderId,
      gross_amount: billedAmt,
      gateway_fee: 0.0,
      tax_on_fee: 0.0,
      net_settlement: 0.0,
      settlement_status: 'FAILED',
      utr_reference: 'NONE',
    });
    // No bank statement credit arrives
    currentOrderNum++;
  }

  // CASE D (~7%): 4 Unidentified Bank Credits
  for (let i = 0; i < 4; i++) {
    const day = (i % 25) + 1;
    const dateStr = `2025-04-${day.toString().padStart(2, '0')}`;
    const mysteryUtr = `UTR99${48000 + i}`;
    const mysteryAmt = [1500.0, 3200.0, 750.0, 4800.0][i % 4];
    const narrations = [
      `UPI/CR/DIRECT_TRANSFER/${mysteryUtr}/INTERNAL_REF`,
      `IMPS/P2A/${mysteryUtr}/VENDOR_REFUND`,
      `NEFT/CR/DIRECT_OFFLINE_PAYMENT/${mysteryUtr}`,
      `CASH_DEP_BRANCH_401/${mysteryUtr}`,
    ];

    bankStatements.push({
      transaction_date: dateStr,
      narration: narrations[i],
      credit_amount: mysteryAmt,
      bank_utr: mysteryUtr,
    });
  }

  return { storeOrders, gatewaySettlements, bankStatements };
}

/**
 * Fuzzy regex candidate extractor for order IDs in messy strings.
 */
export function extractOrderCandidates(text: string): string[] {
  if (!text) return [];
  const candidates: Set<string> = new Set();

  const ordMatches = text.match(/ORD-?\d+/gi);
  if (ordMatches) {
    for (const m of ordMatches) {
      let clean = m.toUpperCase();
      if (!clean.includes('-')) {
        clean = clean.replace('ORD', 'ORD-');
      }
      candidates.add(clean);
    }
  }

  if (candidates.size === 0) {
    const numMatches = text.match(/\b(1\d{3})\b/g);
    if (numMatches) {
      for (const num of numMatches) {
        candidates.add(`ORD-${num}`);
      }
    }
  }

  return Array.from(candidates);
}

/**
 * Executes Two-Tier Closed-Loop Autonomous Double-Entry Reconciliation.
 */
export function reconcileBooks(
  storeOrders: StoreOrder[],
  gatewaySettlements: GatewaySettlement[],
  bankStatements: BankStatementRow[]
): ReconciliationResults {
  const startTime = performance.now();

  const reconciledRecords: ReconciledRecord[] = [];
  const exceptions: HonestException[] = [];

  const storeMap = new Map<string, StoreOrder>();
  for (const s of storeOrders) {
    storeMap.set(s.order_id.trim(), s);
  }

  const gatewayByOrder = new Map<string, GatewaySettlement>();
  const gatewayByUtr = new Map<string, GatewaySettlement>();
  for (const g of gatewaySettlements) {
    const ref = g.order_id_ref.trim();
    gatewayByOrder.set(ref, g);
    const utr = g.utr_reference.trim();
    if (utr && utr !== 'NONE') {
      gatewayByUtr.set(utr, g);
    }
  }

  const matchedBankIndices = new Set<number>();
  const matchedStoreOrders = new Set<string>();

  // TIER 1 & TIER 2 MATCHING
  bankStatements.forEach((bankRow, bIdx) => {
    const bankUtr = bankRow.bank_utr?.trim() || '';
    const narration = bankRow.narration?.trim() || '';
    const creditAmount = Number(bankRow.credit_amount) || 0;

    let matchedGw: GatewaySettlement | undefined = undefined;
    let matchedOrderId: string | undefined = undefined;

    // 1. Primary Deterministic Match by UTR
    if (bankUtr && bankUtr !== 'NONE' && gatewayByUtr.has(bankUtr)) {
      matchedGw = gatewayByUtr.get(bankUtr);
      matchedOrderId = matchedGw?.order_id_ref?.trim();
    }

    // 2. Secondary Regex String Extraction from Narration
    if (!matchedGw) {
      const candidates = extractOrderCandidates(narration);
      for (const cand of candidates) {
        if (gatewayByOrder.has(cand)) {
          matchedGw = gatewayByOrder.get(cand);
          matchedOrderId = cand;
          break;
        }
      }
    }

    if (matchedGw && matchedOrderId && storeMap.has(matchedOrderId)) {
      const storeOrder = storeMap.get(matchedOrderId)!;
      const billedAmt = Number(storeOrder.billed_amount) || 0;
      const gwStatus = matchedGw.settlement_status?.trim();

      if (gwStatus === 'SETTLED') {
        // Tool 1: Standard Fee Verification (abs(Net_Bank - (Gross * 0.9764)) <= 0.05)
        const expectedStandard = Math.round(billedAmt * NET_FACTOR * 100) / 100;
        const diffStandard = Math.abs(creditAmount - expectedStandard);

        // Tool 2: Tax Verification Tool (abs(Net_Bank - ((Gross * 1.18) * 0.9764)) <= 0.05)
        const expectedTax = Math.round(billedAmt * 1.18 * NET_FACTOR * 100) / 100;
        const diffTax = Math.abs(creditAmount - expectedTax);

        if (diffStandard <= TOLERANCE) {
          const deductions = Math.round((billedAmt - creditAmount) * 100) / 100;
          reconciledRecords.push({
            order_id: matchedOrderId,
            customer: storeOrder.customer_name,
            billed_amount: billedAmt,
            bank_settled: creditAmount,
            deductions: deductions,
            audit_explanation: 'MATCHED: Standard 2% Gateway Fee + 18% GST on fee verified.',
            match_category: 'Clean Match (Case A)',
            utr: matchedGw.utr_reference,
            payment_id: matchedGw.payment_id,
          });
          matchedBankIndices.add(bIdx);
          matchedStoreOrders.add(matchedOrderId);
          return;
        } else if (diffTax <= TOLERANCE) {
          const collectedGross = Math.round(billedAmt * 1.18 * 100) / 100;
          const deductions = Math.round((collectedGross - creditAmount) * 100) / 100;
          reconciledRecords.push({
            order_id: matchedOrderId,
            customer: storeOrder.customer_name,
            billed_amount: billedAmt,
            bank_settled: creditAmount,
            deductions: deductions,
            audit_explanation: 'MATCHED: 18% Checkout GST + Gateway deductions verified.',
            match_category: 'Checkout Tax Variance (Case B)',
            utr: matchedGw.utr_reference,
            payment_id: matchedGw.payment_id,
          });
          matchedBankIndices.add(bIdx);
          matchedStoreOrders.add(matchedOrderId);
          return;
        } else if (Math.abs(creditAmount - matchedGw.net_settlement) <= TOLERANCE) {
          const deductions = Math.round((billedAmt - creditAmount) * 100) / 100;
          reconciledRecords.push({
            order_id: matchedOrderId,
            customer: storeOrder.customer_name,
            billed_amount: billedAmt,
            bank_settled: creditAmount,
            deductions: deductions,
            audit_explanation: 'MATCHED: Net settlement matched gateway records.',
            match_category: 'Settlement Match',
            utr: matchedGw.utr_reference,
            payment_id: matchedGw.payment_id,
          });
          matchedBankIndices.add(bIdx);
          matchedStoreOrders.add(matchedOrderId);
          return;
        }
      }
    }
  });

  // TIER 2: HONEST EXCEPTION GUARDRAIL (Zero Hallucination Guarantee)
  // 1. Audit Unmatched Store Orders
  for (const [orderId, storeOrder] of storeMap.entries()) {
    if (matchedStoreOrders.has(orderId)) continue;

    const billedAmt = Number(storeOrder.billed_amount) || 0;
    const gwRecord = gatewayByOrder.get(orderId);

    if (gwRecord) {
      const status = gwRecord.settlement_status?.trim();
      const paymentId = gwRecord.payment_id;

      if (status === 'FAILED') {
        exceptions.push({
          source_layer: 'Gateway Settlement',
          record_ref: `${orderId} (${paymentId})`,
          disputed_amount: billedAmt,
          failure_category: 'GHOST_ORDER_DROP_OFF',
          actionable_audit_diagnosis:
            "Store order marked PAID, but Razorpay settlement status is 'FAILED' with net ₹0.00. No bank credit exists. Customer drop-off or webhook desync. Recommend status correction to CANCELLED.",
        });
      } else {
        exceptions.push({
          source_layer: 'Store / Gateway',
          record_ref: `${orderId} (${paymentId})`,
          disputed_amount: billedAmt,
          failure_category: 'UNSETTLED_GATEWAY_RECORD',
          actionable_audit_diagnosis: `Settlement marked ${status}, but no matching bank credit found for UTR '${gwRecord.utr_reference}'. Potential nodal bank batch delay.`,
        });
      }
    } else {
      exceptions.push({
        source_layer: 'Store Ledger',
        record_ref: orderId,
        disputed_amount: billedAmt,
        failure_category: 'MISSING_GATEWAY_RECORD',
        actionable_audit_diagnosis:
          'Order exists in store ledger as PAID, but has zero corresponding payment record in Gateway logs. Critical audit alert: Possible fraud or phantom checkout.',
      });
    }
  }

  // 2. Audit Unmatched Bank Credits
  bankStatements.forEach((bankRow, bIdx) => {
    if (matchedBankIndices.has(bIdx)) return;

    const creditAmt = Number(bankRow.credit_amount) || 0;
    const bankUtr = bankRow.bank_utr || 'UNKNOWN';
    const narration = bankRow.narration || '';

    exceptions.push({
      source_layer: 'Bank Statement',
      record_ref: bankUtr,
      disputed_amount: creditAmt,
      failure_category: 'UNIDENTIFIED_BANK_CREDIT',
      actionable_audit_diagnosis: `Bank credit of ₹${creditAmt.toFixed(2)} received with narration '${narration.slice(0, 45)}...'. Zero matching store orders or gateway settlements found. Refused auto-match to prevent false credit assignment.`,
    });
  });

  const endTime = performance.now();
  const executionTimeMs = Math.max(0.1, endTime - startTime);
  const totalRecords = storeOrders.length + gatewaySettlements.length + bankStatements.length;
  const totalUnits = reconciledRecords.length + exceptions.length;
  const accuracyRate = totalUnits > 0 ? (reconciledRecords.length / totalUnits) * 100 : 0;
  const netCashVerified = reconciledRecords.reduce((acc, r) => acc + r.bank_settled, 0);
  const totalDisputed = exceptions.reduce((acc, e) => acc + e.disputed_amount, 0);

  return {
    reconciled_records: reconciledRecords,
    exceptions: exceptions,
    execution_time_ms: Math.round(executionTimeMs * 10) / 10,
    total_records_processed: totalRecords,
    throughput_rec_sec: Math.round((totalRecords / (executionTimeMs / 1000))),
    match_accuracy_rate: Math.round(accuracyRate * 10) / 10,
    honest_exceptions_count: exceptions.length,
    net_cash_verified: Math.round(netCashVerified * 100) / 100,
    total_disputed_cash: Math.round(totalDisputed * 100) / 100,
  };
}

/**
 * Helper to parse simple CSV text into objects.
 */
export function parseCSV<T>(csvText: string): T[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const rows: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma ignoring commas inside quotes
    const values: string[] = [];
    let insideQuotes = false;
    let currentValue = '';

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"' || char === "'") {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim().replace(/^["']|["']$/g, ''));
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim().replace(/^["']|["']$/g, ''));

    const rowObj: any = {};
    headers.forEach((header, idx) => {
      let val: any = values[idx] ?? '';
      if (!isNaN(Number(val)) && val !== '') {
        val = Number(val);
      }
      rowObj[header] = val;
    });
    rows.push(rowObj);
  }

  return rows;
}

/**
 * Generate Unified Audit Trail CSV text.
 */
export function generateAuditCSV(results: ReconciliationResults): string {
  const headers = [
    'Audit_Status',
    'Order_ID_or_Ref',
    'Entity_or_Layer',
    'Billed_or_Disputed_Amount_INR',
    'Bank_Settled_Amount_INR',
    'Deductions_INR',
    'Classification',
    'Diagnosis_or_Explanation',
  ];

  const lines = [headers.join(',')];

  for (const r of results.reconciled_records) {
    const row = [
      'VERIFIED_RECONCILED',
      `"${r.order_id}"`,
      `"${r.customer}"`,
      r.billed_amount.toFixed(2),
      r.bank_settled.toFixed(2),
      r.deductions.toFixed(2),
      `"${r.match_category}"`,
      `"${r.audit_explanation.replace(/"/g, '""')}"`,
    ];
    lines.push(row.join(','));
  }

  for (const e of results.exceptions) {
    const row = [
      'HONEST_EXCEPTION',
      `"${e.record_ref}"`,
      `"${e.source_layer}"`,
      e.disputed_amount.toFixed(2),
      '0.00',
      '0.00',
      `"${e.failure_category}"`,
      `"${e.actionable_audit_diagnosis.replace(/"/g, '""')}"`,
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}
