# RazorRecon

### High-throughput, deterministic 3-way financial reconciliation engine

**Built for Razorpay BuildItOn — Track 4: AI Finance Controller**

RazorRecon is a browser-based financial reconciliation engine that automates **3-way matching between storefront orders, Razorpay payment feeds, and bank nodal settlement statements**.

Instead of using generative AI for financial arithmetic, RazorRecon uses **deterministic rules and integer-scaled paisa arithmetic** to ensure calculations remain predictable, auditable, and balanced.

UI/UX design

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/dddc6a53-2fec-4c14-b08d-038dda23d657" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/5272abd7-1ea6-4a5d-b17b-d835fe75ede3" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/26a2c888-811e-4f72-aa16-ab282d698bc7" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/44a02b1f-6e6f-4474-be3b-2deb9dac4665" />
calculator feature
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/13a1010f-0b0c-4d7e-97eb-7f489862a7fe" />
scrachpad feature
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/81214bce-1a65-488d-b621-8700c2103242" />


---

## 🚨 The Problem

Modern e-commerce payments create several reconciliation challenges:

### 1. Gross vs. Net Discrepancies

The amount recorded by a storefront is often different from the amount that reaches the company's bank account because of payment gateway fees and GST.

For example:

```text
Gross Order Amount          ₹1,000.00
Razorpay Processing Fee        ₹20.00
GST on Fee (18%)                ₹3.60
---------------------------------------
Net Settlement               ₹976.40
```

The reconciliation system must account for these deductions instead of treating the gross order value as the bank deposit.

### 2. Silent / Missing Webhooks

A checkout can succeed while the corresponding payment confirmation feed is missing or delayed.

This can create:

* Ghost credits
* Untracked orders
* Missing payment confirmations
* Reconciliation exceptions

### 3. Nodal Settlement Delays

Payments processed through a gateway may reach the bank's nodal settlement account after **T+1 or T+2 days**, making spreadsheet-based reconciliation difficult.

### 4. The Risk of Non-Deterministic AI

Generative LLMs are useful for explanations and analysis, but relying on them for core financial arithmetic introduces unnecessary risk.

Financial reconciliation requires:

* Deterministic calculations
* Balanced entries
* Traceable rules
* Reproducible results

**RazorRecon keeps the financial calculation layer deterministic.**

---

# 💡 The Solution

RazorRecon creates a single reconciliation pipeline:

```text
Storefront Orders
       │
       │ Order ID + Gross Amount
       ▼
┌───────────────────────────┐
│ Deterministic             │
│ Normalization Layer       │
│                           │
│ • Paisa arithmetic        │
│ • Data normalization      │
│ • Composite key mapping   │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ 3-Way Matching Engine     │
│                           │
│ Order ID                  │
│      ↕                    │
│ Razorpay Payment ID       │
│      ↕                    │
│ Bank Settlement UTR       │
└─────────────┬─────────────┘
              │
       ┌──────┴──────┐
       ▼             ▼
   MATCHED       EXCEPTIONS
       │             │
       ▼             ▼
 Ledger Engine   Exception Bucket
       │             │
       └──────┬──────┘
              ▼
       Auditor Scratchpad
              │
              ▼
       Excel Export Engine
```

---

# ⚙️ How RazorRecon Works

RazorRecon processes three independent financial sources:

| Source                   | Important Data         |
| ------------------------ | ---------------------- |
| **Storefront**           | Order ID, Gross Amount |
| **Razorpay Feed**        | Payment ID, Fees, GST  |
| **Bank Nodal Statement** | Net Deposit, Bank UTR  |

The engine normalizes the data and performs deterministic 3-way matching.

### Core calculation

For the configured **2% processing fee + 18% GST on the fee**:

```text
Processing Fee = Gross × 0.02
GST            = Processing Fee × 0.18

Total Charges  = Gross × 0.02 × 1.18

Net Settlement = Gross - Total Charges
```

For a ₹1,000 order:

```text
Processing Fee = ₹20.00
GST            = ₹3.60
Total Charges  = ₹23.60

Expected Net = ₹976.40
```

All financial calculations are performed using **integer-scaled paisa arithmetic** to avoid floating-point precision issues.

---

# 🔍 Deterministic 3-Way Matching

RazorRecon matches transactions using a composite relationship:

```text
Order ID
   ↕
Razorpay Payment ID
   ↕
Bank Settlement UTR
```

Each transaction is classified into a transparent result rather than being artificially forced into a match.

### ✅ Matched Transactions

Records where:

* Storefront order exists
* Razorpay payment exists
* Bank settlement exists
* Expected and actual amounts reconcile

### ⚠️ Honest Exception Bucket

Transactions that cannot be confidently reconciled are isolated instead of being guessed.

Examples include:

* **Fee Overcharge** — gateway deduction exceeds the configured rate
* **Missing Gateway Webhook** — successful storefront order without a corresponding payment feed
* **Uncredited Bank UTR** — payment exists but corresponding bank settlement cannot be matched

This is the core principle of RazorRecon:

> **If the system cannot prove a match, it does not pretend there is one.**

---

# 📒 Automated Journal Vouchers

For reconciled settlement batches, RazorRecon generates balanced double-entry Journal Vouchers.

### Example — JV #RR-2026-JV01

| Account Description                             |    Debit (₹) |   Credit (₹) |
| ----------------------------------------------- | -----------: | -----------: |
| Bank Nodal Account — Actual Received Cash       |       976.40 |            — |
| Razorpay Processing Charges — Operating Expense |        20.00 |            — |
| Input GST Credit — 18% on Processing Charges    |         3.60 |            — |
| Gross Sales Revenue — Customer Contract         |            — |     1,000.00 |
| **Total**                                       | **1,000.00** | **1,000.00** |

```text
Net Variance: ₹0.00
Status: BALANCED
```

The generated entries are structured around the project's intended **Ind AS 115 accounting workflow**.

---

# 📝 Auditor Scratchpad

Reconciliation does not end when a transaction is flagged.

RazorRecon provides an in-app **Auditor Scratchpad** where controllers can:

* Add notes to transactions
* Flag records for review
* Record audit observations
* Retain comments while navigating the application

This creates a persistent workspace for investigating exceptions.

---

# 📊 Multi-Sheet Excel Export

A single export generates a structured `.xlsx` workbook containing:

### Sheet 1 — Executive Summary

High-level reconciliation metrics and settlement overview.

### Sheet 2 — Matched Records

Successfully reconciled transactions with their corresponding financial values.

### Sheet 3 — Exception Register

All unresolved or suspicious transactions with their exception reason.

### Sheet 4 — Journal Vouchers

Balanced accounting entries generated by the reconciliation engine.

---

# ⚡ Instant Demo Mode

RazorRecon includes a **Demo** button directly in the application header.

With one click, realistic mock data is populated across all three sources:

```text
Storefront Orders
        ↓
Razorpay Feed
        ↓
Bank Nodal Statements
        ↓
3-Way Reconciliation
        ↓
Matched + Exceptions
        ↓
Journal Vouchers
        ↓
Excel Export
```

This allows judges and evaluators to experience the complete workflow without manually preparing or uploading datasets.

---

# 🧪 Evaluation Guide

Want to test RazorRecon quickly?

### Step 1 — Launch the application

Open the RazorRecon dashboard.

### Step 2 — Click `Demo`

The application automatically populates mock production-style data.

### Step 3 — Review the Matched Ledger

Verify:

* Gross order amount
* Gateway fees
* GST
* Expected net settlement
* Actual bank deposit
* Reconciliation status

### Step 4 — Open the Honest Exception Bucket

Inspect intentionally introduced reconciliation issues such as:

* Fee variations
* Missing payment confirmations
* Uncredited settlements

### Step 5 — Use the Auditor Scratchpad

Add notes and flags to exception records.

### Step 6 — Export

Click **Export to Excel** and inspect the generated four-sheet financial workbook.

---

# 🏗️ Architecture

```text
┌──────────────────────┐
│  Storefront Orders   │
│  Order ID / Gross    │
└──────────┬───────────┘
           │
┌──────────────────────┐
│   Razorpay Feed      │
│ Payment ID / Fees    │
└──────────┬───────────┘
           │
┌──────────────────────┐
│ Bank Nodal Statements│
│ UTR / Net Deposit    │
└──────────┬───────────┘
           │
           ▼
┌────────────────────────────────┐
│ Deterministic Normalization    │
│                                │
│ • Integer-scaled paisa math    │
│ • Data normalization           │
│ • Composite key mapping        │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│      3-Way Match Core          │
│                                │
│ Order ID ↔ Payment ID ↔ UTR    │
└───────────────┬────────────────┘
                │
       ┌────────┴────────┐
       ▼                 ▼
┌──────────────┐   ┌─────────────────┐
│   Matched    │   │ Honest Exception│
│ Transactions │   │     Bucket      │
└──────┬───────┘   └────────┬────────┘
       │                    │
       ▼                    ▼
┌──────────────┐   ┌─────────────────┐
│ Ind AS 115   │   │ Auditor         │
│ Ledger Engine│   │ Scratchpad      │
└──────┬───────┘   └────────┬────────┘
       │                    │
       └──────────┬─────────┘
                  ▼
        ┌────────────────────┐
        │ Multi-Sheet Excel  │
        │ Export Engine      │
        └────────────────────┘
```

---

# 🛠️ Tech Stack

| Layer                  | Technology                     |
| ---------------------- | ------------------------------ |
| Frontend               | React 18                       |
| Language               | TypeScript                     |
| Build Tool             | Vite                           |
| State Management       | Client-side state architecture |
| Spreadsheet Processing | SheetJS (`xlsx`)               |
| Runtime                | Browser                        |
| Database               | None required                  |
| Export                 | `.xlsx` multi-sheet workbook   |

### Why Client-Side?

RazorRecon performs reconciliation directly in the browser, eliminating unnecessary external database latency for the demo workflow.

The deterministic calculation layer therefore remains:

```text
Input → Normalize → Calculate → Match → Classify → Export
```

with reproducible results.

---

# 🚀 Getting Started

## Prerequisites

* Node.js 18+
* npm, yarn, or pnpm

## Installation

Clone the repository:

```bash
git clone https://github.com/PREETHI0507/AI-FINANCE-CONTROLLER.git
cd AI-FINANCE-CONTROLLER
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the application at:

```text
http://localhost:5173
```

---

# 🎯 Built For

**Razorpay BuildItOn — Track 4: AI Finance Controller**

RazorRecon focuses on a practical financial-controller workflow:

```text
Reconcile
    ↓
Detect Exceptions
    ↓
Explain Variances
    ↓
Generate Accounting Entries
    ↓
Create an Audit Trail
    ↓
Export
```

The goal is simple:

### **Make financial reconciliation deterministic, transparent, and auditable.**

---

# 📄 License

This project is licensed under the **MIT License**.
