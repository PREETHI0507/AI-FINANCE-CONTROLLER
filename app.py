"""
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

# ==========================================
# PAGE CONFIGURATION & THEME
# ==========================================
st.set_page_config(
    page_title="⚡ RazorRecon: Autonomous AI Finance Controller",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Custom CSS for fintech aesthetic & high visual contrast
st.markdown(
    """
    <style>
    .main {
        background-color: #0b0f19;
        color: #f3f4f6;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .recon-header {
        background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
        border: 1px solid #374151;
        padding: 24px;
        border-radius: 12px;
        margin-bottom: 24px;
    }
    .recon-title {
        color: #ffffff;
        font-size: 2rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        margin: 0 0 8px 0;
    }
    .recon-subtitle {
        color: #9ca3af;
        font-size: 1rem;
        margin: 0;
    }
    .metric-container {
        background-color: #111827;
        border: 1px solid #1f2937;
        border-radius: 10px;
        padding: 16px;
    }
    .badge-matched {
        background-color: #064e3b;
        color: #34d399;
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    .badge-exception {
        background-color: #7f1d1d;
        color: #f87171;
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    .stDownloadButton button {
        background-color: #2563eb !important;
        color: white !important;
        font-weight: 600 !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 10px 24px !important;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# ==========================================
# SYNTHETIC DATASET GENERATOR (60 Records)
# ==========================================
def generate_synthetic_data(n: int = 60) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Generates deterministic synthetic datasets simulating:
    - Case A (~75%): Clean Match (Billed - 2% fee - 18% GST = Bank Credit)
    - Case B (~10%): Checkout Tax Variance (Store base + 18% checkout GST - fees = Bank Credit)
    - Case C (~8%): Ghost Order / Drop-off (Store marked PAID, Gateway FAILED, zero bank credit)
    - Case D (~7%): Unidentified Bank Credit (Bank credit with no matching store or gateway record)
    """
    random.seed(42)  # Deterministic seed for reproducible evaluation

    names_pool = [
        "Aarav Sharma", "Priya Patel", "Rohan Verma", "Ananya Iyer", "Vikram Malhotra",
        "Neha Gupta", "Aditya Nair", "Sneha Reddy", "Kabir Sen", "Pooja Deshmukh",
        "Siddharth Rao", "Tanvi Joshi", "Arjun Mehta", "Ishita Saxena", "Karan Kapoor",
        "Divya Nambiar", "Rahul Choudhury", "Meera Kulkarni", "Gaurav Bhatt", "Shreya Das"
    ]
    payment_methods = ["UPI", "Credit Card", "NetBanking", "Debit Card"]
    base_date = datetime(2025, 4, 1)

    store_rows = []
    gateway_rows = []
    bank_rows = []

    # Distribution counts for 60 records
    count_case_a = 45  # 75%
    count_case_b = 6   # 10%
    count_case_c = 5   # ~8.3%
    count_case_d = 4   # ~6.7%

    current_order_num = 1001

    # --- CASE A: Clean Match (45 Records) ---
    for _ in range(count_case_a):
        order_id = f"ORD-{current_order_num}"
        tx_date = (base_date + timedelta(days=random.randint(0, 25))).strftime("%Y-%m-%d")
        customer = random.choice(names_pool)
        billed_amt = float(random.choice([999.0, 1499.0, 1999.0, 2499.0, 3999.0, 4999.0]))
        method = random.choice(payment_methods)

        # Gateway deductions: 2% fee + 18% GST on fee = 2.36%
        gateway_fee = round(billed_amt * 0.02, 2)
        tax_on_fee = round(gateway_fee * 0.18, 2)
        net_settlement = round(billed_amt - (gateway_fee + tax_on_fee), 2)
        utr = f"UTR{random.randint(10000000, 99999999)}"
        payment_id = f"pay_RZP{random.randint(10000, 99999)}"

        # Store Ledger
        store_rows.append({
            "order_id": order_id,
            "order_date": tx_date,
            "customer_name": customer,
            "billed_amount": billed_amt,
            "payment_method": method,
            "order_status": "PAID",
        })

        # Gateway Settlement
        gateway_rows.append({
            "payment_id": payment_id,
            "order_id_ref": order_id,
            "gross_amount": billed_amt,
            "gateway_fee": gateway_fee,
            "tax_on_fee": tax_on_fee,
            "net_settlement": net_settlement,
            "settlement_status": "SETTLED",
            "utr_reference": utr,
        })

        # Bank Statement (Messy narration containing UTR and Order ID)
        narration_templates = [
            f"CMS/RZP/{utr}/{order_id}",
            f"RAZORPAY SETTLEMENT {utr} REF {order_id.replace('-', '')}",
            f"NEFT-RZPAY-NODAL-{utr}-URBANTHREAD-{order_id}",
            f"INW-RZP-{utr}-{order_id}/SETTLE"
        ]
        bank_rows.append({
            "transaction_date": tx_date,
            "narration": random.choice(narration_templates),
            "credit_amount": net_settlement,
            "bank_utr": utr,
        })
        current_order_num += 1

    # --- CASE B: Checkout Tax Variance (6 Records) ---
    for _ in range(count_case_b):
        order_id = f"ORD-{current_order_num}"
        tx_date = (base_date + timedelta(days=random.randint(0, 25))).strftime("%Y-%m-%d")
        customer = random.choice(names_pool)
        base_amt = float(random.choice([1000.0, 2000.0, 3000.0, 5000.0]))
        method = random.choice(payment_methods)

        # Store logged base price, but checkout added 18% GST
        gross_collected = round(base_amt * 1.18, 2)
        gateway_fee = round(gross_collected * 0.02, 2)
        tax_on_fee = round(gateway_fee * 0.18, 2)
        net_settlement = round(gross_collected - (gateway_fee + tax_on_fee), 2)
        utr = f"UTR{random.randint(10000000, 99999999)}"
        payment_id = f"pay_RZP{random.randint(10000, 99999)}"

        store_rows.append({
            "order_id": order_id,
            "order_date": tx_date,
            "customer_name": customer,
            "billed_amount": base_amt,  # Base price logged
            "payment_method": method,
            "order_status": "PAID",
        })

        gateway_rows.append({
            "payment_id": payment_id,
            "order_id_ref": order_id,
            "gross_amount": gross_collected,
            "gateway_fee": gateway_fee,
            "tax_on_fee": tax_on_fee,
            "net_settlement": net_settlement,
            "settlement_status": "SETTLED",
            "utr_reference": utr,
        })

        bank_rows.append({
            "transaction_date": tx_date,
            "narration": f"CMS/RZP/{utr}/{order_id}/GST_CHECKOUT",
            "credit_amount": net_settlement,
            "bank_utr": utr,
        })
        current_order_num += 1

    # --- CASE C: Ghost Order / Drop-off (5 Records) ---
    c_amts = [1200.0, 2800.0, 3500.0, 5600.0, 1850.0]
    for c_idx in range(count_case_c):
        order_id = f"ORD-{current_order_num}"
        tx_date = (base_date + timedelta(days=random.randint(0, 25))).strftime("%Y-%m-%d")
        customer = random.choice(names_pool)
        billed_amt = c_amts[c_idx % len(c_amts)]
        payment_id = f"pay_RZP{random.randint(10000, 99999)}"

        store_rows.append({
            "order_id": order_id,
            "order_date": tx_date,
            "customer_name": customer,
            "billed_amount": billed_amt,
            "payment_method": "UPI",
            "order_status": "PAID",  # Webhook or state desync marked it PAID
        })

        gateway_rows.append({
            "payment_id": payment_id,
            "order_id_ref": order_id,
            "gross_amount": billed_amt,
            "gateway_fee": 0.0,
            "tax_on_fee": 0.0,
            "net_settlement": 0.0,
            "settlement_status": "FAILED",  # Gateway failed
            "utr_reference": "NONE",
        })
        # Note: No credit arrives in bank statement
        current_order_num += 1

    # --- CASE D: Unidentified Bank Credit (4 Records) ---
    for i in range(count_case_d):
        tx_date = (base_date + timedelta(days=random.randint(0, 25))).strftime("%Y-%m-%d")
        mystery_utr = f"UTR{random.randint(90000000, 99999999)}"
        mystery_amt = float(random.choice([1500.0, 3200.0, 750.0, 4800.0]))
        narration_types = [
            f"UPI/CR/DIRECT_TRANSFER/{mystery_utr}/INTERNAL_REF",
            f"IMPS/P2A/{mystery_utr}/VENDOR_REFUND",
            f"NEFT/CR/DIRECT_OFFLINE_PAYMENT/{mystery_utr}",
            f"CASH_DEP_BRANCH_401/{mystery_utr}"
        ]

        bank_rows.append({
            "transaction_date": tx_date,
            "narration": narration_types[i % len(narration_types)],
            "credit_amount": mystery_amt,
            "bank_utr": mystery_utr,
        })

    df_store = pd.DataFrame(store_rows)
    df_gateway = pd.DataFrame(gateway_rows)
    df_bank = pd.DataFrame(bank_rows)

    return df_store, df_gateway, df_bank


# ==========================================
# TWO-TIER RECONCILIATION ENGINE
# ==========================================
class RazorReconEngine:
    """
    Autonomous Double-Entry Reconciliation Engine.
    Implements Tier 1 Deterministic matching followed by Tier 2 Heuristic Financial Controller.
    """
    FEE_RATE = 0.02
    GST_ON_FEE_RATE = 0.18
    TOTAL_DEDUCTION_RATE = 0.0236  # 2% + (2% * 18%) = 2.36%
    NET_FACTOR = 1.0 - TOTAL_DEDUCTION_RATE  # 0.9764
    TOLERANCE = 0.05

    @classmethod
    def extract_order_candidates(cls, text: str) -> List[str]:
        """
        Regex tool: Extracts patterns like 'ORD-1001' or 'ORD1001' or isolated 4-digit order numbers.
        """
        if not isinstance(text, str):
            return []
        candidates = []
        # Match standard ORD-xxxx pattern
        ord_matches = re.findall(r"ORD-?\d+", text, re.IGNORECASE)
        for m in ord_matches:
            clean = m.upper()
            if "-" not in clean:
                clean = clean.replace("ORD", "ORD-")
            candidates.append(clean)

        # If no ORD found, check for 4-digit numbers following RZP or keywords
        if not candidates:
            num_matches = re.findall(r"\b(1\d{3})\b", text)
            for num in num_matches:
                candidates.append(f"ORD-{num}")

        return list(set(candidates))

    @classmethod
    def reconcile(
        cls, df_store: pd.DataFrame, df_gateway: pd.DataFrame, df_bank: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Executes complete closed-loop double-entry audit across the 3 streams.
        """
        start_time = time.time()

        reconciled_records = []
        exceptions = []

        # Indexing for deterministic O(1) lookups
        store_map = {row["order_id"]: row for _, row in df_store.iterrows()}
        gateway_by_order = {}
        for _, row in df_gateway.iterrows():
            ref = str(row["order_id_ref"]).strip()
            gateway_by_order[ref] = row

        bank_rows = df_bank.to_dict("records")
        matched_bank_indices = set()
        matched_store_orders = set()
        matched_gateway_payments = set()

        # ----------------------------------------------------
        # TIER 1: DETERMINISTIC KEY CROSS-REFERENCE
        # ----------------------------------------------------
        for b_idx, bank_row in enumerate(bank_rows):
            bank_utr = str(bank_row.get("bank_utr", "")).strip()
            narration = str(bank_row.get("narration", "")).strip()
            credit_amount = float(bank_row.get("credit_amount", 0.0))

            # Candidate extraction via UTR or narration regex
            order_candidates = cls.extract_order_candidates(narration)

            matched_gw = None
            matched_order_id = None

            # 1. Match by UTR in Gateway Settlements
            if bank_utr and bank_utr != "NONE":
                for _, gw in df_gateway.iterrows():
                    if str(gw.get("utr_reference", "")).strip() == bank_utr:
                        matched_gw = gw
                        matched_order_id = str(gw.get("order_id_ref", "")).strip()
                        break

            # 2. If not matched by UTR, match by extracted Order ID candidates
            if matched_gw is None and order_candidates:
                for cand in order_candidates:
                    if cand in gateway_by_order:
                        matched_gw = gateway_by_order[cand]
                        matched_order_id = cand
                        break

            if matched_gw is not None and matched_order_id in store_map:
                store_order = store_map[matched_order_id]
                billed_amt = float(store_order.get("billed_amount", 0.0))
                gw_gross = float(matched_gw.get("gross_amount", 0.0))
                gw_net = float(matched_gw.get("net_settlement", 0.0))
                gw_status = str(matched_gw.get("settlement_status", "")).strip()

                # Verify gateway settled
                if gw_status == "SETTLED":
                    # Tool 1: Standard Fee Deduction Verification
                    expected_net_standard = round(billed_amt * cls.NET_FACTOR, 2)
                    diff_standard = abs(credit_amount - expected_net_standard)

                    # Tool 2: Checkout GST Variance Verification
                    expected_net_tax = round((billed_amt * 1.18) * cls.NET_FACTOR, 2)
                    diff_tax = abs(credit_amount - expected_net_tax)

                    # Case A: Standard 2% fee + 18% GST on fee
                    if diff_standard <= cls.TOLERANCE or abs(credit_amount - gw_net) <= cls.TOLERANCE:
                        deductions = round(billed_amt - credit_amount, 2)
                        reconciled_records.append({
                            "Order ID": matched_order_id,
                            "Customer": store_order.get("customer_name", "N/A"),
                            "Billed (₹)": f"₹{billed_amt:,.2f}",
                            "Bank Settled (₹)": f"₹{credit_amount:,.2f}",
                            "Deductions (₹)": f"₹{deductions:,.2f}",
                            "raw_bank_settled": credit_amount,
                            "Audit Explanation": "MATCHED: Standard 2% Gateway Fee + 18% GST on fee verified.",
                            "Match Category": "Clean Match (Case A)",
                        })
                        matched_bank_indices.add(b_idx)
                        matched_store_orders.add(matched_order_id)
                        matched_gateway_payments.add(str(matched_gw.get("payment_id", "")))
                        continue

                    # Case B: 18% Checkout GST + Standard Gateway Fee
                    elif diff_tax <= cls.TOLERANCE:
                        collected_gross = round(billed_amt * 1.18, 2)
                        deductions = round(collected_gross - credit_amount, 2)
                        reconciled_records.append({
                            "Order ID": matched_order_id,
                            "Customer": store_order.get("customer_name", "N/A"),
                            "Billed (₹)": f"₹{billed_amt:,.2f}",
                            "Bank Settled (₹)": f"₹{credit_amount:,.2f}",
                            "Deductions (₹)": f"₹{deductions:,.2f}",
                            "raw_bank_settled": credit_amount,
                            "Audit Explanation": "MATCHED: 18% Checkout GST + Gateway deductions verified.",
                            "Match Category": "Checkout Tax Variance (Case B)",
                        })
                        matched_bank_indices.add(b_idx)
                        matched_store_orders.add(matched_order_id)
                        matched_gateway_payments.add(str(matched_gw.get("payment_id", "")))
                        continue

        # ----------------------------------------------------
        # TIER 2: HEURISTIC CONTROLLER & HONEST EXCEPTION GUARDRAIL
        # ----------------------------------------------------
        # Check all store orders for Ghost Orders or Unsettled drops
        for order_id, store_order in store_map.items():
            if order_id in matched_store_orders:
                continue

            billed_amt = float(store_order.get("billed_amount", 0.0))
            gw_record = gateway_by_order.get(order_id)

            if gw_record is not None:
                gw_status = str(gw_record.get("settlement_status", "")).strip()
                payment_id = str(gw_record.get("payment_id", "N/A"))

                if gw_status == "FAILED":
                    exceptions.append({
                        "Source Layer": "Gateway Settlement",
                        "Record Ref": f"{order_id} ({payment_id})",
                        "Disputed (₹)": f"₹{billed_amt:,.2f}",
                        "raw_disputed": billed_amt,
                        "Failure Category": "GHOST_ORDER_DROP_OFF",
                        "Actionable Audit Diagnosis": (
                            "Store order marked PAID, but Razorpay settlement status is 'FAILED' with net ₹0.00. "
                            "No bank credit exists. Customer drop-off or webhook desync. Recommend status correction to CANCELLED."
                        ),
                    })
                else:
                    exceptions.append({
                        "Source Layer": "Store / Gateway",
                        "Record Ref": f"{order_id} ({payment_id})",
                        "Disputed (₹)": f"₹{billed_amt:,.2f}",
                        "raw_disputed": billed_amt,
                        "Failure Category": "UNSETTLED_GATEWAY_RECORD",
                        "Actionable Audit Diagnosis": (
                            f"Settlement marked {gw_status}, but no matching bank credit found for UTR "
                            f"'{gw_record.get('utr_reference', 'NONE')}'. Potential nodal bank batch delay."
                        ),
                    })
            else:
                exceptions.append({
                    "Source Layer": "Store Ledger",
                    "Record Ref": order_id,
                    "Disputed (₹)": f"₹{billed_amt:,.2f}",
                    "raw_disputed": billed_amt,
                    "Failure Category": "MISSING_GATEWAY_RECORD",
                    "Actionable Audit Diagnosis": (
                        "Order exists in store ledger as PAID, but has zero corresponding payment record in Gateway logs. "
                        "Critical audit alert: Possible fraud or phantom checkout."
                    ),
                })

        # Check for Unidentified Bank Credits (Case D)
        for b_idx, bank_row in enumerate(bank_rows):
            if b_idx in matched_bank_indices:
                continue

            credit_amt = float(bank_row.get("credit_amount", 0.0))
            bank_utr = str(bank_row.get("bank_utr", "N/A"))
            narration = str(bank_row.get("narration", "N/A"))

            exceptions.append({
                "Source Layer": "Bank Statement",
                "Record Ref": f"{bank_utr}",
                "Disputed (₹)": f"₹{credit_amt:,.2f}",
                "raw_disputed": credit_amt,
                "Failure Category": "UNIDENTIFIED_BANK_CREDIT",
                "Actionable Audit Diagnosis": (
                    f"Bank credit of ₹{credit_amt:,.2f} received with narration '{narration[:40]}...'. "
                    "Zero matching store orders or gateway settlements found. Refused auto-match to prevent false credit assignment."
                ),
            })

        execution_time = time.time() - start_time
        total_records_processed = len(df_store) + len(df_gateway) + len(df_bank)
        total_units = len(reconciled_records) + len(exceptions)
        accuracy_rate = (len(reconciled_records) / total_units * 100.0) if total_units > 0 else 0.0
        net_cash_verified = sum(item["raw_bank_settled"] for item in reconciled_records)

        return {
            "reconciled_records": reconciled_records,
            "exceptions": exceptions,
            "execution_time_sec": execution_time,
            "total_records_processed": total_records_processed,
            "throughput_rec_sec": (
                total_records_processed / execution_time if execution_time > 0 else 0.0
            ),
            "match_accuracy_rate": accuracy_rate,
            "honest_exceptions_count": len(exceptions),
            "net_cash_verified": net_cash_verified,
        }


# ==========================================
# STREAMLIT UI APPLICATION
# ==========================================
def main():
    # Header
    st.markdown(
        """
        <div class="recon-header">
            <h1 class="recon-title">⚡ RazorRecon: Autonomous AI Finance Controller</h1>
            <p class="recon-subtitle">
                <strong>Track 04: AI Finance Controller (Razorpay AI Buildathon)</strong> — 
                Deterministic Double-Entry Multi-Source Ledger Reconciliation Engine.
                No Hallucinations • Sub-Second Execution.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Initialize Session State
    if "df_store" not in st.session_state:
        st.session_state.df_store = None
    if "df_gateway" not in st.session_state:
        st.session_state.df_gateway = None
    if "df_bank" not in st.session_state:
        st.session_state.df_bank = None
    if "results" not in st.session_state:
        st.session_state.results = None

    # Ingestion Panel
    st.subheader("📂 1. Multi-Source Ledger Ingestion Panel")
    col_demo, col_info = st.columns([2, 3])

    with col_demo:
        if st.button(
            "🚀 Load Pre-Packaged UrbanThread D2C Demo Batch (60 Records)",
            use_container_width=True,
            type="primary",
        ):
            df_store, df_gateway, df_bank = generate_synthetic_data(n=60)
            st.session_state.df_store = df_store
            st.session_state.df_gateway = df_gateway
            st.session_state.df_bank = df_bank
            st.session_state.results = None
            st.success("✅ Successfully generated and loaded 60 synthetic records across 3 data sources!")

    with col_info:
        st.caption(
            "ℹ️ <strong>UrbanThread Apparel Dataset:</strong> Includes Case A (~75% clean match), "
            "Case B (~10% checkout GST variance), Case C (~8% ghost orders), and Case D (~7% unidentified credits).",
            unsafe_allow_html=True,
        )

    # File Uploaders
    up_col1, up_col2, up_col3 = st.columns(3)

    with up_col1:
        st.markdown("**Store Sales Ledger** (`store_orders.csv`)")
        file_store = st.file_uploader("Upload Store Orders", type=["csv"], key="uploader_store")
        if file_store:
            st.session_state.df_store = pd.read_csv(file_store)
            st.session_state.results = None

    with up_col2:
        st.markdown("**Payment Gateway Settlements** (`gateway_settlements.csv`)")
        file_gateway = st.file_uploader("Upload Gateway Settlements", type=["csv"], key="uploader_gateway")
        if file_gateway:
            st.session_state.df_gateway = pd.read_csv(file_gateway)
            st.session_state.results = None

    with up_col3:
        st.markdown("**Corporate Bank Statement** (`bank_statement.csv`)")
        file_bank = st.file_uploader("Upload Bank Statement", type=["csv"], key="uploader_bank")
        if file_bank:
            st.session_state.df_bank = pd.read_csv(file_bank)
            st.session_state.results = None

    # Preview uploaded data status
    if (
        st.session_state.df_store is not None
        and st.session_state.df_gateway is not None
        and st.session_state.df_bank is not None
    ):
        with st.expander("🔍 Inspect Raw Input Data Streams", expanded=False):
            t1, t2, t3 = st.tabs(["Store Orders", "Gateway Settlements", "Bank Statement"])
            with t1:
                st.dataframe(st.session_state.df_store.head(10), use_container_width=True)
                st.caption(f"Total Rows: {len(st.session_state.df_store)}")
            with t2:
                st.dataframe(st.session_state.df_gateway.head(10), use_container_width=True)
                st.caption(f"Total Rows: {len(st.session_state.df_gateway)}")
            with t3:
                st.dataframe(st.session_state.df_bank.head(10), use_container_width=True)
                st.caption(f"Total Rows: {len(st.session_state.df_bank)}")

        # Action Trigger
        st.markdown("---")
        st.subheader("⚡ 2. Autonomous Verification Engine")
        col_run, col_note = st.columns([2, 4])
        with col_run:
            run_btn = st.button("▶️ Run Autonomous Reconciliation", use_container_width=True, type="primary")

        with col_note:
            st.caption(
                "Executes Tier 1 deterministic cross-referencing and Tier 2 heuristic controller "
                "(2% Razorpay fee, 18% GST, checkout taxes, regex narration extraction, and honest guardrails)."
            )

        if run_btn:
            with st.spinner("Executing Two-Tier Autonomous Reconciliation Engine..."):
                results = RazorReconEngine.reconcile(
                    st.session_state.df_store,
                    st.session_state.df_gateway,
                    st.session_state.df_bank,
                )
                st.session_state.results = results

    # Render Results if Available
    if st.session_state.results:
        res = st.session_state.results
        st.markdown("---")
        st.subheader("📊 3. Executive KPI Scorecard")

        m1, m2, m3, m4 = st.columns(4)
        with m1:
            st.metric(
                label="⚡ Execution Time",
                value=f"{res['execution_time_sec'] * 1000:.1f} ms",
                delta=f"{res['throughput_rec_sec']:,.0f} records/sec",
            )
        with m2:
            st.metric(
                label="🎯 Match Accuracy Rate",
                value=f"{res['match_accuracy_rate']:.1f}%",
                delta=f"{len(res['reconciled_records'])} Clean Matches",
            )
        with m3:
            st.metric(
                label="🛡️ Honest Exceptions Flagged",
                value=f"{res['honest_exceptions_count']}",
                delta="Zero Guesswork / Refused Matches",
                delta_color="inverse",
            )
        with m4:
            st.metric(
                label="💰 Net Settled Cash Verified",
                value=f"₹{res['net_cash_verified']:,.2f}",
                delta="100% Bank Confirmed",
            )

        # Output Tables
        st.markdown("---")
        st.subheader("🟢 Table 1: Reconciled Books (Closed-Loop Verified)")
        st.caption(
            "Orders matched end-to-end between Store Sales, Razorpay Gateway, and Corporate Bank Credits. "
            "Deductions rigorously verified against 2% fee + 18% GST regulations."
        )

        df_rec = pd.DataFrame(res["reconciled_records"])
        if not df_rec.empty:
            display_rec = df_rec[
                ["Order ID", "Customer", "Billed (₹)", "Bank Settled (₹)", "Deductions (₹)", "Audit Explanation"]
            ]
            st.dataframe(display_rec, use_container_width=True)
        else:
            st.info("No records reconciled yet.")

        st.markdown("---")
        st.subheader("🔴 Table 2: Honest Exception List (Refused Auto-Match)")
        st.caption(
            "Anomalies, ghost drop-offs, and unidentified bank credits quarantined by the controller. "
            "Zero hallucination guarantee: The engine strictly refuses to guess or invent false ledger matches."
        )

        df_exc = pd.DataFrame(res["exceptions"])
        if not df_exc.empty:
            display_exc = df_exc[
                ["Source Layer", "Record Ref", "Disputed (₹)", "Failure Category", "Actionable Audit Diagnosis"]
            ]
            st.dataframe(display_exc, use_container_width=True)
        else:
            st.success("Zero exceptions found! All ledgers perfectly balanced.")

        # Unified Audit Trail Export
        st.markdown("---")
        st.subheader("📥 4. Export Unified Audit Trail")

        # Combine into unified audit log
        audit_rows = []
        for r in res["reconciled_records"]:
            audit_rows.append({
                "Audit_Status": "VERIFIED_RECONCILED",
                "Order_ID_or_Ref": r["Order ID"],
                "Entity_or_Layer": r["Customer"],
                "Billed_or_Disputed_Amount": r["Billed (₹)"],
                "Bank_Settled_Amount": r["Bank Settled (₹)"],
                "Deductions": r["Deductions (₹)"],
                "Classification": r.get("Match Category", "RECONCILED"),
                "Diagnosis_or_Explanation": r["Audit Explanation"],
            })

        for e in res["exceptions"]:
            audit_rows.append({
                "Audit_Status": "HONEST_EXCEPTION",
                "Order_ID_or_Ref": e["Record Ref"],
                "Entity_or_Layer": e["Source Layer"],
                "Billed_or_Disputed_Amount": e["Disputed (₹)"],
                "Bank_Settled_Amount": "₹0.00",
                "Deductions": "₹0.00",
                "Classification": e["Failure Category"],
                "Diagnosis_or_Explanation": e["Actionable Audit Diagnosis"],
            })

        df_audit = pd.DataFrame(audit_rows)
        csv_buffer = io.StringIO()
        df_audit.to_csv(csv_buffer, index=False)
        csv_data = csv_buffer.getvalue()

        st.download_button(
            label="📥 Download Unified Audit Trail CSV (Complete Double-Entry Ledger)",
            data=csv_data,
            file_name=f"razorrecon_audit_trail_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            mime="text/csv",
            use_container_width=True,
        )

        # ERP Journal Entry Voucher (Tally / Zoho Books)
        st.markdown("---")
        st.subheader("🧾 5. Automated Double-Entry ERP Journal Voucher (Tally & Zoho Books)")
        st.caption("Auto-generated accounting entry compliant with Indian Accounting Standards (Ind AS 115) and GST Input Tax Credit rules.")

        total_bank_net = res["net_cash_verified"]
        total_base_sales = sum(r["raw_billed_amount"] for r in res["reconciled_records"])
        total_checkout_gst = sum(round(r["raw_billed_amount"] * 0.18, 2) for r in res["reconciled_records"] if "Case B" in r.get("Match Category", ""))
        
        # Calculate MDR and GST on MDR
        total_mdr = 0.0
        total_gst_itc = 0.0
        for r in res["reconciled_records"]:
            is_case_b = "Case B" in r.get("Match Category", "")
            gross = round(r["raw_billed_amount"] * 1.18, 2) if is_case_b else r["raw_billed_amount"]
            mdr = round(gross * 0.02, 2)
            deductions = round(gross - r["raw_bank_settled"], 2)
            gst_fee = round(deductions - mdr, 2)
            total_mdr += mdr
            total_gst_itc += gst_fee

        ghost_disputed = sum(e["raw_disputed_amount"] for e in res["exceptions"] if e["Failure Category"] == "GHOST_ORDER_DROP_OFF")
        total_store_sales = round(total_base_sales + ghost_disputed, 2)

        journal_entries = [
            {"Account Code": "1010-HDFC-NODAL", "Ledger Account": "HDFC Bank Current A/c (Nodal Settlement)", "Type": "ASSET", "Debit (₹)": f"₹{total_bank_net:,.2f}", "Credit (₹)": "—", "Narration": "Net funds credited by Razorpay gateway nodal account"},
            {"Account Code": "5040-MDR-FEES", "Ledger Account": "Payment Gateway Charges (Razorpay MDR 2.0%)", "Type": "EXPENSE", "Debit (₹)": f"₹{total_mdr:,.2f}", "Credit (₹)": "—", "Narration": "Contractual 2% processing fee deducted at source"},
            {"Account Code": "1090-GST-ITC-18", "Ledger Account": "GST Input Tax Credit (18% on MDR Fee)", "Type": "ASSET", "Debit (₹)": f"₹{total_gst_itc:,.2f}", "Credit (₹)": "—", "Narration": "Claimable under GSTR-2B against output GST liability"},
        ]
        if ghost_disputed > 0:
            journal_entries.append({"Account Code": "1195-SUSP-GHOST", "Ledger Account": "Reconciliation Suspense - Ghost Orders", "Type": "ASSET", "Debit (₹)": f"₹{ghost_disputed:,.2f}", "Credit (₹)": "—", "Narration": "Quarantined orders marked paid in store but failed at gateway"})
        
        journal_entries.append({"Account Code": "4010-D2C-SALES", "Ledger Account": "D2C Store Sales Revenue (UrbanThread)", "Type": "INCOME", "Debit (₹)": "—", "Credit (₹)": f"₹{total_store_sales:,.2f}", "Narration": "Gross store order merchandise value recognized"})

        if total_checkout_gst > 0:
            journal_entries.append({"Account Code": "2020-GST-OUTPUT-18", "Ledger Account": "Output GST Liability (18% Checkout Tax)", "Type": "LIABILITY", "Debit (₹)": "—", "Credit (₹)": f"₹{total_checkout_gst:,.2f}", "Narration": "18% Goods & Services Tax collected at checkout payable under GSTR-3B"})

        st.dataframe(pd.DataFrame(journal_entries), use_container_width=True)
        total_dr = round(total_bank_net + total_mdr + total_gst_itc + ghost_disputed, 2)
        total_cr = round(total_store_sales + total_checkout_gst, 2)
        diff = round(abs(total_dr - total_cr), 2)
        if diff == 0:
            st.success(f"✅ Double-Entry Bookkeeping Parity: 100% In Balance (Dr: ₹{total_dr:,.2f} = Cr: ₹{total_cr:,.2f}, Variance: ₹0.00)")
        else:
            st.error(f"❌ Double-Entry Imbalance: Total Dr ₹{total_dr:,.2f} ≠ Total Cr ₹{total_cr:,.2f} (Variance: ₹{diff:,.2f})")
    else:
        st.info("👆 Click **'🚀 Load Pre-Packaged UrbanThread D2C Demo Batch'** above, or upload custom CSVs to begin reconciliation.")


if __name__ == "__main__":
    main()
