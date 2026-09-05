export interface StoreOrder {
  order_id: string;
  order_date: string;
  customer_name: string;
  billed_amount: number;
  payment_method: string;
  order_status: string;
}

export interface GatewaySettlement {
  payment_id: string;
  order_id_ref: string;
  gross_amount: number;
  gateway_fee: number;
  tax_on_fee: number;
  net_settlement: number;
  settlement_status: string;
  utr_reference: string;
}

export interface BankStatementRow {
  transaction_date: string;
  narration: string;
  credit_amount: number;
  bank_utr: string;
}

export interface ReconciledRecord {
  order_id: string;
  customer: string;
  billed_amount: number;
  bank_settled: number;
  deductions: number;
  audit_explanation: string;
  match_category: string;
  utr: string;
  payment_id: string;
}

export interface HonestException {
  source_layer: string;
  record_ref: string;
  disputed_amount: number;
  failure_category: string;
  actionable_audit_diagnosis: string;
}

export interface ReconciliationResults {
  reconciled_records: ReconciledRecord[];
  exceptions: HonestException[];
  execution_time_ms: number;
  total_records_processed: number;
  throughput_rec_sec: number;
  match_accuracy_rate: number;
  honest_exceptions_count: number;
  net_cash_verified: number;
  total_disputed_cash: number;
}
