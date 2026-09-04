# KharchyaPani — AI Features & Architecture Guide (v3.0)

This document provides a comprehensive overview of all Artificial Intelligence (AI) features implemented in **KharchyaPani**, including backend architectures, API contracts, frontend UI components, user flows, and manual testing procedures.

---

## 1. Executive Summary of AI Suite

KharchyaPani features a **Provider-Agnostic AI Financial Intelligence Engine** designed to automate expense tracking, provide contextual financial advisory, and project future budget health.

### Core Architectural Layering
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Next.js 14 App Router (Frontend)                      │
│   • Kharcha AI Copilot Drawer        • AI Receipt Scanner Modal             │
│   • Voice Auto-Parse Input Component • AI Spending Velocity & Forecast Card │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST API (Bearer JWT / HttpOnly)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FastAPI AI Router (`/api/ai/*`)                       │
│                         (Pydantic v2 Schemas)                               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ AIFactory Resolution
                                       ▼
             ┌─────────────────────────────────────────────────┐
             │       BaseAIProvider (Abstract Interface)       │
             └───────────────┬─────────────────┬───────────────┘
                             │                 │
                             ▼                 ▼
          ┌───────────────────────┐ ┌──────────────────────┐
          │    GeminiProvider     │ │    MockAIProvider    │
          │ (gemini-flash-latest) │ │ (Offline Fallback &  │
          │   with 503 Fallback   │ │ Heuristic Projection)│
          └───────────────────────┘ └──────────────────────┘
```

---

## 2. Comprehensive AI Features Breakdown

### 🤖 1. Kharcha AI — Conversational Copilot
* **Purpose**: An interactive financial advisor directly embedded into the app that answers user questions about their monthly spending, budget health, and savings opportunities.
* **Frontend Component**: [`frontend/components/ai/KharchaMitraDrawer.tsx`](file:///d:/ProjectFolder/KharchyaPani/frontend/components/ai/KharchaMitraDrawer.tsx)
* **Access Points**:
  * **Top Navbar**: Click on the `🤖 Kharcha AI ✨` button in the navigation header.
  * **Floating Launcher**: Bottom-right floating animated pill with glowing cyan-sky gradient.
* **Backend Route**: `POST /api/ai/chat`
* **Key Capabilities**:
  * **Context Injection**: Automatically injects current month's total spend, active monthly budget limit, top expense categories, and category breakdown into prompt context.
  * **Multilingual Input Understanding**: Accurately understands queries in English, Marathi, and Hindi/Hinglish (e.g., *"या महिन्यात माझा किती खर्च झाला?"*, *"How much did I spend this month?"*).
  * **Interactive Quick Action Chips**: Suggested pills for 1-click questions (*"How much did I spend this month?"*, *"What is my highest expense category?"*, *"Tips to save money"*).
  * **Suggested Navigation Links**: Returns actionable shortcuts (e.g., `View All Expenses`, `Check Budgets`) that route users to the relevant pages.

---

### 📷 2. Multimodal AI Receipt Scanner (OCR)
* **Purpose**: Allows users to snap a photo or upload an invoice/receipt to automatically populate the expense form in 1 click.
* **Frontend Component**: [`frontend/components/ai/ReceiptScannerModal.tsx`](file:///d:/ProjectFolder/KharchyaPani/frontend/components/ai/ReceiptScannerModal.tsx)
* **Backend Route**: `POST /api/ai/scan-receipt` (Multipart form-data)
* **Key Capabilities**:
  * **Laser Scanning UI**: Futuristic neon-cyan laser scanning animation while processing.
  * **Structured Data Extraction**:
    * **Amount**: Extracts final invoice total (e.g., ₹485.50).
    * **Date**: Extracts billing date or defaults to current date.
    * **Merchant Name**: Recognizes store/vendor (e.g., DMart, Shell, Reliance Fresh).
    * **Category Mapping**: Intelligently predicts category based on purchased items.
    * **Payment Mode**: Detects UPI, Cash, or Card from receipt footer.
    * **Confidence Score**: Displays extraction certainty percentage.
  * **1-Click Form Fill**: Pressing "Use Extracted Data" instantly transfers the extracted data into the Add Expense form.

---

### 🎙️ 3. Smart Voice Expense Entry with Auto-Parse
* **Purpose**: Enables rapid, hands-free expense entry via voice speech or natural language text.
* **Frontend Component**: [`frontend/components/ai/VoiceExpenseInput.tsx`](file:///d:/ProjectFolder/KharchyaPani/frontend/components/ai/VoiceExpenseInput.tsx)
* **Backend Route**: `POST /api/ai/parse-expense`
* **Key Capabilities**:
  * **Web Speech API Integration**: Integrated browser speech recognition with language toggle (`en-IN` / `mr-IN`).
  * **Hands-Free Auto-Parse**: As soon as speech recognition detects silence and concludes speech (`recognition.onend`), it **automatically runs parsing without requiring any extra button click**.
  * **Relative Date Understanding**: Understands phrases like *"yesterday"*, *"काल"*, *"day before yesterday"*, *"परवा"*, correctly calculating the target date.
  * **Natural Language Extraction Examples**:
    * *"Bought petrol for 250 rs yesterday via UPI"* $\rightarrow$ Amount: ₹250, Date: Yesterday, Mode: UPI, Category: Fuel/Transport.
    * *"काल मित्रांसोबत चहा नाश्ता केला ₹120"* $\rightarrow$ Amount: ₹120, Date: Yesterday, Mode: UPI, Category: Food.
  * **Visual Feedback**: Real-time microphone listening pulses and green confirmation banner when fields are populated.

---

### 🎯 4. Multi-Tier Smart Fuzzy Category Matcher
* **Purpose**: Guarantees that AI-extracted text (which may say "Groceries", "Uber", or "Zomato") accurately matches the user's specific database category names (e.g., "Food", "Travel").
* **Frontend Component**: Integrated directly inside [`frontend/components/expenses/ExpenseForm.tsx`](file:///d:/ProjectFolder/KharchyaPani/frontend/components/expenses/ExpenseForm.tsx)
* **Matching Strategy (3 Tiers)**:
  1. **Exact Match**: Case-insensitive direct string equality.
  2. **Substring Match**: Checks if the AI suggestion is contained within the category name or vice-versa.
  3. **Keyword Dictionary Mapping**:
     * *Food*: `food`, `grocery`, `groceries`, `kirana`, `swiggy`, `zomato`, `restaurant`, `chai`, `coffee`, `चहा`, `नाश्ता`.
     * *Travel*: `travel`, `fuel`, `petrol`, `diesel`, `uber`, `ola`, `auto`, `metro`, `cab`, `रिक्षा`.
     * *Bills*: `bill`, `electricity`, `light`, `wifi`, `recharge`, `rent`, `utilities`.
     * *Health*: `health`, `medical`, `medicine`, `doctor`, `hospital`, `औषध`.
     * *Shopping*: `shopping`, `clothes`, `amazon`, `flipkart`, `mall`.

---

### 📈 5. AI Spending Velocity & Depletion Forecast
* **Purpose**: Real-time financial health advisor on the dashboard that monitors spending pace, projects month-end totals, warns of early budget depletion, and gives personalized savings tips.
* **Frontend Component**: [`frontend/components/dashboard/AIInsightsCard.tsx`](file:///d:/ProjectFolder/KharchyaPani/frontend/components/dashboard/AIInsightsCard.tsx)
* **Backend Route**: `GET /api/ai/insights`
* **Mathematical Model**:
  $$\text{Daily Velocity} = \frac{\text{Monthly Total Spent}}{\text{Current Day of Month}}$$
  $$\text{Projected Spend} = \text{Daily Velocity} \times \text{Days in Month (30)}$$
* **Dynamic UI States**:
  * **Safe State (Emerald Green)**:
    * Condition: $\text{Projected Spend} \le \text{Monthly Budget}$
    * Header: **"Great Financial Discipline!"**
    * Message: *"Your current month's spending is well under control and within budget limits. Keep up the great financial discipline!"*
  * **Warning State (Amber Alert)**:
    * Condition: $\text{Projected Spend} > \text{Monthly Budget}$
    * Header: **"Over-Budget Alert"**
    * Badge: Shows exact projected exhaustion date: `Projected: the Xth of this month`
    * Message: *"At your current daily spending rate of ₹X/day, your monthly budget is projected to run out by the Xth of this month."*
  * **Targeted Smart Savings Tips**: Dynamically targets the user's highest spending category to provide 2 actionable recommendations.

---

## 3. Backend Architecture: Provider-Agnostic AI Engine

All AI operations are governed by clean architectural contracts in [`backend/app/services/ai/`](file:///d:/ProjectFolder/KharchyaPani/backend/app/services/ai/):

| File | Purpose |
|---|---|
| [`base.py`](file:///d:/ProjectFolder/KharchyaPani/backend/app/services/ai/base.py) | Abstract `BaseAIProvider` defining `scan_receipt`, `parse_expense_text`, `generate_insights`, and `chat`. |
| [`gemini_provider.py`](file:///d:/ProjectFolder/KharchyaPani/backend/app/services/ai/gemini_provider.py) | Google Gemini (`gemini-flash-latest` via Google AI REST API). Features automatic error catching and seamless fallback to `MockAIProvider` on any 503 high demand spike, quota exhaustion, or timeout. |
| [`mock_provider.py`](file:///d:/ProjectFolder/KharchyaPani/backend/app/services/ai/mock_provider.py) | Self-contained, dependency-free mock engine using intelligent regex heuristics and velocity calculations so the application **never crashes** if an API key is missing or network fails. |
| [`factory.py`](file:///d:/ProjectFolder/KharchyaPani/backend/app/services/ai/factory.py) | `AIFactory` dynamically resolves the active provider based on environment variable: `AI_PROVIDER=auto\|gemini\|openai\|mock`. |

---

## 4. API Specification Summary

### `POST /api/ai/scan-receipt`
* **Request**: `multipart/form-data` with `file: image/*` (max 5MB)
* **Response**:
```json
{
  "amount": 485.50,
  "expense_date": "2026-09-04",
  "merchant_name": "Supermarket & General Store",
  "suggested_category_name": "Shopping",
  "suggested_category_id": 1,
  "payment_mode": "UPI",
  "note": "Receipt scan: Groceries and daily essentials (Sample Mock Scan)",
  "confidence": 0.96,
  "raw_text": "DMart Supermarket\nTotal: 485.50\n..."
}
```

### `POST /api/ai/parse-expense`
* **Request**: `{"text": "Lunch at cafe 320 rs via card"}`
* **Response**:
```json
{
  "amount": 320.0,
  "expense_date": "2026-09-04",
  "suggested_category_name": "Food",
  "suggested_category_id": 2,
  "payment_mode": "Card",
  "note": "Lunch at cafe 320 rs via card",
  "confidence": 0.98
}
```

### `POST /api/ai/chat`
* **Request**:
```json
{
  "message": "What is my highest spending category?",
  "history": []
}
```
* **Response**:
```json
{
  "reply": "Your highest spending category this month is 'Food'...",
  "suggested_actions": [
    { "label": "View All Expenses", "href": "/expenses" },
    { "label": "Check Budgets", "href": "/budgets" }
  ]
}
```

### `GET /api/ai/insights`
* **Response**:
```json
{
  "velocity_warning": {
    "has_warning": false,
    "category_name": "Food",
    "predicted_exhaustion_date": null,
    "message": "Your current month's spending is well under control and within budget limits. Keep up the great financial discipline!"
  },
  "savings_tips": [
    "Cutting down on weekend dining out or online food delivery by 15% can save up to ₹1,200 each month.",
    "Keep track of daily micro UPI payments (₹20–₹50), as they accumulate into a substantial amount by month-end."
  ]
}
```

---

## 5. Verification & Test Coverage

* **Pytest Test Suite**: Verified with `backend\tests\test_ai.py`
  * `test_ai_parse_expense_marathi` — Tests Indian / Marathi syntax parsing.
  * `test_ai_parse_expense_english` — Tests English syntax parsing.
  * `test_ai_scan_receipt` — Tests multimodal OCR payload processing.
  * `test_ai_chat_kharchamitra` — Tests conversational copilot response structure.
  * `test_ai_insights` — Tests spending velocity and savings tips generation.
  * `test_ai_unauthenticated_rejected` — Verifies strict 401 unauthorized blocking.
* **Test Status**: **39/39 Passing (100%)**
* **Frontend Compilation**: **13/13 Routes Passing (100%)** via `next build`
