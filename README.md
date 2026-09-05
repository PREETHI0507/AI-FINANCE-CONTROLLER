RazorRecon
High-throughput, deterministic 3-way financial reconciliation engine built for Razorpay BuildItOn — Track 4: AI Finance Controller.
The Problem
Gross vs. Net Discrepancies: The gross order amount on Shopify/WooCommerce rarely equals what lands in the company's bank account due to gateway transaction cuts (
$2.00\%$ platform fee $+ 18\%$ GST on fee $= 2.36\%$ net fee).
Silent Dropped Webhooks: Checkouts succeed or fail without triggering or receiving gateway webhooks, creating ghost credits and untracked orders.
Nodal Float & Timing Delays: Funds cleared on Razorpay take $T+1$ or $T+2$ days to hit HDFC/ICICI nodal settlement accounts, breaking manual spreadsheet reconciliation.
Risk of Non-Deterministic AI: Using generative LLMs for core arithmetic in finance leads to catastrophic numerical hallucinations and unbalanced double entries.
RazorRecon (pronounced Graz-er-con) is a high-speed, client-side reconciliation engine that automates 3-way matching across storefronts, Razorpay feeds, and bank nodal
Instead of relying on unpredictable LLM arithmetic, RazorRecon enforces deterministic mathematical invariant rules directly in the browser runtime. It guarantees zero-hallucination
ledger balancing, isolates unmatchable rows into a transparent Honest Exception Bucket, generates Ind AS 115 double-entry Journal Vouchers (JVs), and provides an Auditor
Scratchpad with instant multi-sheet Excel export.
Deterministic 3-Way Matching: Cross-matches records on a composite key (Order ID $\leftrightarrow$ Razorpay Payment ID $\leftrightarrow$ Bank Settlement UTR) with sub-millisecond execution.
Fee Discrepancies: Gateway cuts exceeding the contractual $2.36\%$ rate.Missing Gateway Webhooks: Successful storefront orders with missing payment confirmation feeds.
Fee Discrepancies: Gateway cuts exceeding the contractual $2.36\%$ rate.Missing Gateway Webhooks: Successful storefront orders with missing payment confirmation feeds.
Automated Ind AS 115 Journal Vouchers: Automatically outputs balanced, double-entry accounting entries for every settlement batch.
Auditor Scratchpad: In-app persistent workspace for controllers to annotate flagged transactions, record audit notes, and retain comments across navigation.
Multi-Sheet Excel Export: One-click download of a structured .xlsx workbook containing the Executive Summary, Matched Ledger, Exception Register, and Balanced Journal Vouchers.
Instant Demo Mode: A single-click header button that loads mock production datasets across all three sources for immediate evaluation.
[ Storefront Orders ]       [ Razorpay Feed ]       [ Bank Nodal Statements ]
 (Order ID, Gross Amt)    (Payment ID, Fees, GST)     (Net Deposit, Bank UTR)
          │                          │                           │
          └──────────────────────────┼───────────────────────────┘
                                     ▼
                  ┌─────────────────────────────────────┐
                  │ Deterministic Normalization Layer   │
                  │  - Integer-scaled paisa arithmetic  │
                  │  - Composite key mapping            │
                  └──────────────────┬──────────────────┘
                                     ▼
                  ┌─────────────────────────────────────┐
                  │     3-Way Composite Match Core      │
                  │ Net = Gross - (Gross * 0.02 * 1.18) │
                  └──────────────────┬──────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
       [ Matched Transactions ]              [ Honest Exception Bucket ]
                 │                            - Fee Overcharge (> 2.36%)
                 ▼                            - Missing Gateway Webhook
    ┌──────────────────────────┐              - Uncredited Bank UTR
    │ Ind AS 115 Ledger Engine │                         │
    │  - Cr: Gross Sales       │                         ▼
    │  - Dr: Bank Account      │             ┌─────────────────────────┐
    │  - Dr: Processing Fees   │             │   Auditor Scratchpad    │
    │  - Dr: Input GST (18%)   │             │   - Inline flags/notes  │
    └────────────┬─────────────┘             └────────────┬────────────┘
                 │                                        │
                 └───────────────────┬────────────────────┘
                                     ▼
                  ┌─────────────────────────────────────┐
                  │   Multi-Sheet Excel Export Engine   │
                  │    Sheet 1: Executive Summary       │
                  │    Sheet 2: Matched Records         │
                  │    Sheet 3: Exception Register      │
                  │    Sheet 4: Ind AS 115 Journal Vouchers
                  └──────────────────────────────--------

Journal Voucher: #RR-2026-JV01
Standard: Ind AS 115 Compliant
Journal Voucher: #RR-2026-JV01
Standard: Ind AS 115 Compliant
-------------------------------------------------------------------------
Account Description                                  Debit (₹)   Credit (₹)
-------------------------------------------------------------------------
Bank Nodal Account (Actual Received Cash)               976.40            -
Razorpay Processing Charges (Operating Expense)          20.00            -
Input GST Credit (18% on Processing Charges)              3.60            -
Gross Sales Revenue (Recognized Customer Contract)           -     1,000.00
-------------------------------------------------------------------------
Total:                                                1,000.00     1,000.00
Net Variance: ₹0.00 (Balanced)
Core Runtime: React 18, TypeScript, Vite

State Management: Client-side state architecture with zero external database latency

Spreadsheet Processing: SheetJS (xlsx) for multi-tab financial workbook construction

Design & Layout: Modern dashboard optimized for scannability and quick audit workflows
Prerequisites
Node.js v18.0.0 or higher

npm, yarn, or pnpm
Clone the repository:

Bash


git clone https://github.com/your-username/razor-recon.git
cd razor-recon
Bash


npm install
Bash


npm run dev

Open the application:
Navigate to http://localhost:5173.

Evaluation Guide (For Judges)
Open the application dashboard (http://localhost:5173).

Click the Demo button in the header to populate realistic multi-source data without needing manual CSV uploads.

Review the Matched Ledger to see real-time calculation across gross amounts, net bank deposits, and the exact $2.36\%$ fee calculation.

Switch to the Honest Exception Bucket to inspect isolated fee variations, dropped webhooks, and uncredited UTRs.
Use the Auditor Scratchpad to add inline review comments on any discrepancy.
Click Export to Excel to verify the downloadable four-sheet workbook containing the auto-generated Ind AS 115 Journal Vouchers.
License
This project is licensed under the MIT License — see the LICENSE file for details.
