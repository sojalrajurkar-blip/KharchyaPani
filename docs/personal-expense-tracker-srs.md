# Software Requirements Specification (SRS)
## Personal Expense Tracker (KharchyaPani)

---

## 1. Document Information

| Field | Value |
|---|---|
| Document Title | Software Requirements Specification — Personal Expense Tracker (KharchyaPani) |
| Source PRD | Personal Expense Tracker PRD, Version 3.0 (Approved — Multi-User Authentication, Data Isolation & AI Financial Intelligence) |
| SRS Version | 3.0 |
| Status | Implementation-Ready |
| Intended Audience | AI coding agents, software engineering team, QA, DevOps |
| Technology Authority | This SRS (Section 10) is the authoritative source of truth for all architectural, technical, and security decisions. The PRD is the source of truth for product and business requirements. |

---

## 2. Purpose

This SRS defines the complete, implementation-ready technical specification for **KharchyaPani** with enterprise-grade authentication, multi-tenant user data isolation, and the **AI-Powered Financial Intelligence Suite**.

It specifies:
- Secure JWT authentication architecture with short-lived Access Tokens and HttpOnly Refresh Token rotation.
- **Sign in with Google** via OAuth 2.0 / OpenID Connect.
- Strict multi-tenant data ownership across all API endpoints and database models (Zero RBAC/Admin; complete per-user isolation).
- **AI Financial Intelligence Engine**:
  - Multimodal Vision Receipt OCR for automatic expense field extraction.
  - Multilingual Speech-to-Text and Natural Language parsing (Marathi, Hindi, English).
  - Conversational AI Co-Pilot (*KharchaMitra*) answering queries over private financial datasets.
  - Spending velocity prediction and automated monthly savings opportunity algorithms.
- Full REST API contracts, database schemas, Alembic migrations, frontend/backend architecture, error handling, rate limiting, and automated testing strategies.

---

## 3. Scope

### 3.1 In Scope
- **Authentication & User Management**:
  - Sign Up / Registration (Email + Password with PBKDF2/BCrypt hashing)
  - Sign In / Login (Email + Password)
  - **Sign In with Google** (OAuth 2.0 / OpenID Connect server-side token validation & account linking)
  - Secure Logout (Current session cookie clear & token revocation)
  - Logout from all active devices/sessions (Bulk refresh token revocation)
  - Self-service Forgot Password & Reset Password flows
  - Authenticated Change Password
  - Short-lived JWT Access Token (10–15 mins) + Long-lived Refresh Token (7–30 days)
  - Automatic Access Token refresh via frontend API interceptor
  - Server-side Refresh Token rotation & SHA-256 token hashing in PostgreSQL
  - Rate limiting on authentication endpoints
- **User Data Isolation (Multi-Tenancy)**:
  - Every authenticated user has access **only to their own** expenses, categories, budgets, and dashboard statistics.
  - Ownership is authoritatively resolved on the backend via validated JWT tokens. Client-provided `user_id` parameters are never trusted for authorization.
- **AI Financial Intelligence Suite (New in v3.0)**:
  - **Receipt & Bill OCR Service** (`POST /api/ai/scan-receipt`): Multimodal visual recognition extracting amount, date, vendor, line items, and category suggestion with confidence scoring.
  - **Natural Language Expense Parser** (`POST /api/ai/parse-expense`): Parses unstructured voice/text phrases into validated Pydantic expense payloads.
  - **KharchaMitra Conversational Advisor** (`POST /api/ai/chat`): Private conversational agent synthesizing financial advice over tenant-scoped aggregates.
  - **Spending Velocity & Budget Alerts** (`GET /api/ai/insights`): Computes daily run-rate vs. remaining budget to calculate predicted exhaustion dates.
- **Expense Tracking & Management**:
  - Full CRUD operations with payment mode tracking (`Cash`, `UPI`, `Card`, `Net Banking`)
  - Multi-filtering by category, payment mode, date range, and keyword search
- **Dynamic Category Management**:
  - User-specific custom categories with default starter seed categories on registration
  - Inline category creation and renaming directly in expense forms without form data loss
  - Deletion protection (`409 Conflict` if category is linked to existing expenses)
- **Daily & Monthly Budgeting**:
  - Real-time spend vs. limit calculations with strict calendar-month boundary enforcement
- **Dashboard & Analytics**:
  - Live summary aggregates (Today, Monthly, All-time)
  - Interactive Recharts Category Pie Chart with tooltips
  - AI Insights Card with velocity warnings and actionable tips
- **Progressive Web App (PWA)**:
  - Native Web App Manifest, Service Worker offline caching, and custom install prompt
- **DevOps & Testing**:
  - 100% automated test coverage with Pytest (including AI mocks), Dockerfiles, and cloud deployment on Vercel & Render

### 3.2 Out of Scope
- Role-Based Access Control (RBAC) or Super-Admin portals (explicitly not needed)
- Joint/Shared group wallets or corporate approval hierarchies
- Payment gateways and direct net-banking credential scraping
- Stock market / Crypto / Portfolio tracking

---

## 4. Technology Stack

| Layer | Technology | Version / Specification |
|---|---|---|
| Frontend Framework | Next.js (App Router) | 14.2+ |
| Frontend Language | TypeScript | 5.0+ |
| Styling & Theme | Tailwind CSS + Vanilla CSS | Titanium & Ice Blue Modern Dark Theme |
| Frontend Motion | Framer Motion | 11.0+ |
| Data Visualization | Recharts | 2.12+ |
| Voice & Speech | Web Speech API | `webkitSpeechRecognition` / native browser API with fallback |
| PWA Support | Service Worker + Web Manifest | Native Next.js 14 `manifest.ts` + `public/sw.js` |
| Backend Framework | FastAPI | 0.110+ |
| Backend Language | Python | 3.8+ / 3.11+ |
| AI / LLM Engine | Google Gemini API | `gemini-1.5-flash` / `gemini-2.0-flash` via `google-generativeai>=0.8.0` |
| Image Processing | Pillow (PIL) | 10.0+ |
| Validation | Pydantic v2 | `pydantic-settings` (`SettingsConfigDict`) |
| ORM & Migrations | SQLAlchemy + Alembic | Declarative 2.0 style |
| Password Hashing | `passlib[bcrypt]` / `bcrypt` / PBKDF2 | High cost factor / 100k rounds |
| JWT Tokens | `python-jose[cryptography]` / `PyJWT` | HS256 algorithm |
| Google OAuth | `google-auth` / OpenID Connect | Token verification via Google API |
| Rate Limiting | `slowapi` | In-memory / Redis-ready rate limiting |
| Database (Dev) | PostgreSQL / SQLite (Test) | Local PostgreSQL `localhost:5432` |
| Database (Prod) | Supabase PostgreSQL | Managed cloud instance |
| Frontend Hosting | Vercel | Production CDN & edge |
| Backend Hosting | Render | Web Service container |

---

## 5. System Architecture & Flow

### 5.1 Architecture Diagram
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                Next.js 14 Frontend                                     │
│  - In-Memory Access Token (15 min)                                                     │
│  - HttpOnly SameSite Refresh Token Cookie (30 day)                                     │
│  - Web Speech Recognition Hook (Marathi / Hindi / English)                             │
│  - Components: ReceiptScannerModal, VoiceExpenseInput, KharchaMitraChat, AIInsights    │
│  - Axios/Fetch 401 Auto-Refresh Interceptor                                            │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │ HTTPS REST (Bearer Token + HttpOnly Cookie)
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                FastAPI Backend Layer                                   │
│  - get_current_user Security Dependency (Strict Multi-Tenancy)                          │
│  - Rate Limiter (Slowapi - Auth & AI Endpoints)                                        │
│  - Resource Routers (/api/auth, /api/expenses, /api/categories, /api/budgets)          │
│  - AI Router (/api/ai/scan-receipt, /api/ai/parse-expense, /api/ai/chat, /api/insights)│
│  - AI Service Layer: Context Anonymizer & Gemini 1.5/2.0 Client                        │
└───────────────────────┬───────────────────────────────────────────────┬────────────────┘
                        │ SQLAlchemy ORM                                │ Server-to-Server HTTPS
                        ▼                                               ▼
┌────────────────────────────────────────────────────────┐   ┌───────────────────────────┐
│               PostgreSQL Database (Supabase)           │   │    Google Gemini API      │
│  - users (id, email, hashed_password, google_id)       │   │  - gemini-1.5-flash       │
│  - refresh_tokens (user_id, token_hash, expires_at)    │   │  - Multimodal Vision      │
│  - categories (user_id FK, name)                       │   │  - Structured Function    │
│  - expenses (user_id FK, amount, category_id, date)    │   │    Calling (Pydantic)     │
│  - budgets (user_id FK, period_type, amount_limit)     │   └───────────────────────────┘
└────────────────────────────────────────────────────────┘
```

### 5.2 JWT Authentication & Rotation Flow
1. **Login / Google Sign-In**:
   - User authenticates successfully.
   - Backend generates:
     - **Access Token**: Short-lived (15 minutes), payload `{ "sub": "<user_id>", "email": "<email>", "exp": ... }`.
     - **Refresh Token**: High-entropy cryptographically secure random string (UUID/hex, 30 days expiry).
   - Backend hashes the Refresh Token (SHA-256) and stores it in the `refresh_tokens` database table.
   - Backend returns the Access Token in the JSON response body and sets the Refresh Token in a `Set-Cookie` header (`HttpOnly; Secure; SameSite=Lax; Path=/api/auth`).
2. **Authenticated Resource Requests**:
   - Frontend passes `Authorization: Bearer <access_token>` in HTTP headers.
   - Backend `get_current_user` dependency verifies JWT signature and extracts `user_id`.
   - Backend queries filter strictly on `where(Resource.user_id == current_user.id)`.
3. **Automatic Token Refresh**:
   - When Access Token expires (HTTP 401 returned), frontend interceptor calls `POST /api/auth/refresh` with the HttpOnly cookie.
   - Backend verifies the presented refresh token against the hashed record in `refresh_tokens`. If valid, rotates tokens; if compromised, revokes all user sessions.
4. **Logout**:
   - `POST /api/auth/logout`: Revokes the current refresh token in the database and clears the client cookie.
   - `POST /api/auth/logout-all`: Revokes **all** active refresh tokens for the user in the database and clears the client cookie.

---

## 6. Database Schema Specification

### 6.1 `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY GENERATED ALWAYS AS IDENTITY | Unique User ID |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE, INDEX | Normalized lowercase user email |
| `hashed_password` | VARCHAR(255) | NULLABLE | PBKDF2 / BCrypt hash (null for pure Google OAuth users) |
| `full_name` | VARCHAR(150) | NOT NULL | User's display name |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Account active status |
| `is_verified` | BOOLEAN | NOT NULL, DEFAULT FALSE | Email verification status |
| `google_id` | VARCHAR(255) | NULLABLE, UNIQUE, INDEX | Google OpenID identifier |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Registration timestamp |

### 6.2 `refresh_tokens`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY GENERATED ALWAYS AS IDENTITY | Token ID |
| `user_id` | INTEGER | NOT NULL, FK → `users(id)` ON DELETE CASCADE | Target User ID |
| `token_hash` | VARCHAR(64) | NOT NULL, UNIQUE, INDEX | SHA-256 hash of reset token |
| `expires_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Reset token expiry (1 hour) |
| `is_used` | BOOLEAN | NOT NULL, DEFAULT FALSE | Used status flag |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Issuance timestamp |

### 6.4 `categories`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY GENERATED ALWAYS AS IDENTITY | Category ID |
| `user_id` | INTEGER | NOT NULL, FK → `users(id)` ON DELETE CASCADE, INDEX | Owner User ID |
| `name` | VARCHAR(100) | NOT NULL | Category name |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Creation timestamp |
| *Constraint* | UNIQUE (`user_id`, `lower(name)`) | Case-insensitive uniqueness per user |

### 6.5 `expenses`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY GENERATED ALWAYS AS IDENTITY | Expense ID |
| `user_id` | INTEGER | NOT NULL, FK → `users(id)` ON DELETE CASCADE, INDEX | Owner User ID |
| `amount` | NUMERIC(12,2) | NOT NULL, CHECK (amount > 0) | Expense amount |
| `category_id` | INTEGER | NOT NULL, FK → `categories(id)` ON DELETE RESTRICT | Category reference |
| `expense_date` | DATE | NOT NULL, INDEX | Transaction date |
| `payment_mode` | VARCHAR(50) | NOT NULL, DEFAULT 'UPI' | `Cash`, `UPI`, `Card`, `Net Banking` |
| `note` | VARCHAR(500) | NULLABLE | Optional expense description |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Last update timestamp |

### 6.6 `budgets`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY GENERATED ALWAYS AS IDENTITY | Budget ID |
| `user_id` | INTEGER | NOT NULL, FK → `users(id)` ON DELETE CASCADE, INDEX | Owner User ID |
| `period_type` | VARCHAR(20) | NOT NULL (`daily` \| `monthly`) | Budget duration |
| `category_id` | INTEGER | NULLABLE, FK → `categories(id)` ON DELETE CASCADE | Optional category filter |
| `amount_limit` | NUMERIC(12,2) | NOT NULL, CHECK (amount_limit > 0) | Spending limit |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Last update timestamp |
| *Constraint* | UNIQUE (`user_id`, `period_type`, `category_id`) | One budget per period/category per user |

---

## 7. Complete API Contract

### 7.1 Authentication Endpoints (`/api/auth`)
- `POST /api/auth/register`: Register new account (rate limit: 5/min).
- `POST /api/auth/login`: Authenticate and receive JWT credentials (rate limit: 10/min).
- `POST /api/auth/google`: Verify Google ID token and authenticate/provision user.
- `POST /api/auth/refresh`: Rotate refresh token and issue new access token.
- `POST /api/auth/logout`: Revoke active session cookie.
- `POST /api/auth/logout-all`: Invalidate all active sessions for the user across all devices.
- `POST /api/auth/forgot-password`: Request password reset email (rate limit: 3/min).
- `POST /api/auth/reset-password`: Update password using one-time token.
- `POST /api/auth/change-password`: Update password for authenticated user.
- `GET /api/auth/me`: Get current authenticated user profile.

### 7.2 Core Resource Endpoints
*All endpoints require header `Authorization: Bearer <access_token>` and authoritatively scope database queries to `current_user.id`.*

#### Categories (`/api/categories`)
- `GET /api/categories`: Returns all categories owned by `current_user.id`.
- `POST /api/categories`: Creates category for `current_user.id`.
- `PUT /api/categories/{id}`: Updates category if owned by `current_user.id`.
- `DELETE /api/categories/{id}`: Deletes category if owned by `current_user.id` and has 0 linked expenses (returns `409 Conflict` if in use).

#### Expenses (`/api/expenses`)
- `GET /api/expenses`: Returns expenses owned by `current_user.id` with optional filters (`category_id`, `payment_mode`, `date_from`, `date_to`, `search`).
- `POST /api/expenses`: Creates expense with `user_id = current_user.id`. Validates category ownership.
- `GET /api/expenses/{id}`: Returns expense if owned by `current_user.id`.
- `PUT /api/expenses/{id}`: Updates expense if owned by `current_user.id`.
- `DELETE /api/expenses/{id}`: Deletes expense if owned by `current_user.id`.

#### Budgets (`/api/budgets`)
- `POST /api/budgets`: Upserts daily or monthly budget for `current_user.id`.
- `GET /api/budgets/status`: Calculates active daily and calendar-month spend vs limit for `current_user.id`.

#### Dashboard (`/api/dashboard`)
- `GET /api/dashboard`: Computes aggregated metrics (Today, Monthly, All-time totals, Category breakdown, Recent expenses) strictly for `current_user.id`.

---

### 7.3 AI Financial Intelligence Endpoints (`/api/ai`)
*All AI endpoints require valid Bearer token and enforce strict per-user rate limits.*

#### `POST /api/ai/scan-receipt`
- **Content-Type**: `multipart/form-data`
- **Payload**: `file: UploadFile` (Image format: JPEG, PNG, WebP; max size: 5MB).
- **Processing**: Uploaded image is converted to in-memory bytes and submitted to Gemini 1.5 Flash Vision along with the list of the user's existing category names.
- **Rate Limit**: 10 requests/minute per user.
- **Response `200 OK`**:
  ```json
  {
    "amount": 450.50,
    "expense_date": "2026-09-02",
    "merchant_name": "Siddhivinayak Supermarket",
    "suggested_category_name": "Groceries",
    "suggested_category_id": 4,
    "payment_mode": "UPI",
    "note": "Items: Milk, Wheat flour, Cooking oil",
    "confidence": 0.94
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Unsupported file format or image larger than 5MB.
  - `422 Unprocessable Entity`: AI could not detect any readable transaction or monetary amount.
  - `503 Service Unavailable`: AI service timeout / rate limit fallback response.

#### `POST /api/ai/parse-expense`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "text": "काल मित्रांसोबत कॅफेमध्ये ₹350 चा नाश्ता केला UPI ने"
  }
  ```
- **Processing**: Gemini parses multilingual text (Marathi, Hindi, English) and normalizes relative dates ("काल" → `yesterday`, "today" → `current_date`).
- **Response `200 OK`**:
  ```json
  {
    "amount": 350.00,
    "expense_date": "2026-09-02",
    "suggested_category_name": "Food & Drinks",
    "suggested_category_id": 1,
    "payment_mode": "UPI",
    "note": "मित्रांसोबत कॅफेमध्ये नाश्ता",
    "confidence": 0.98
  }
  ```

#### `POST /api/ai/chat` (KharchaMitra Co-Pilot)
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "message": "या महिन्यात मी खाण्यापिण्यावर किती खर्च केला?",
    "history": [
      { "role": "user", "content": "Hello" },
      { "role": "assistant", "content": "नमस्कार! मी तुमचा खर्चामित्र. मी तुम्हाला खर्चाचे नियोजन करण्यात कशी मदत करू?" }
    ]
  }
  ```
- **Backend Context Assembly**:
  - Backend queries database strictly for `user_id == current_user.id`.
  - Calculates aggregated summaries: This month's total spend, category totals, active budgets, and top 5 recent expenses.
  - Formulates a system prompt ensuring zero PII (no emails, names, or account numbers), injecting only safe aggregated numbers.
- **Response `200 OK`**:
  ```json
  {
    "reply": "या महिन्यात तुम्ही 'Food & Drinks' वर एकूण ₹4,250 खर्च केले आहेत. तुमच्या ₹5,000 च्या मासिक बजेटपैकी 85% बजेट संपले असून अजून 12 दिवस शिल्लक आहेत. बजेट पाळण्यासाठी दररोज खाण्यावरील खर्च ₹60 च्या आत ठेवा.",
    "suggested_actions": [
      { "label": "Food & Drinks खर्च पाहा", "href": "/expenses?category=1" },
      { "label": "बजेट तपासा", "href": "/budgets" }
    ]
  }
  ```

#### `GET /api/ai/insights`
- **Processing**: Computes mathematical spending velocity ($V = \frac{\text{Spent So Far}}{\text{Days Elapsed}}$) and compares against remaining budget.
- **Response `200 OK`**:
  ```json
  {
    "velocity_warning": {
      "has_warning": true,
      "category_name": "Food & Drinks",
      "predicted_exhaustion_date": "2026-09-18",
      "message": "तुमच्या सध्याच्या खर्चाच्या गतीने Food & Drinks बजेट 18 सप्टेंबर रोजी संपू शकते."
    },
    "savings_tips": [
      "शनिवार-रविवारचा सरासरी खर्च इतर दिवसांपेक्षा 3.2 पट जास्त आहे. वीकेंडवरील आउटिंग थोडे कमी करून तुम्ही महिन्याला ₹1,500 वाचवू शकता.",
      "या महिन्यात UPI द्वारे 78% लहान खर्च झाले आहेत. लहान खर्चांवर लक्ष ठेवा."
    ]
  }
  ```

---

## 8. Frontend Architecture & AI Integration

### 8.1 Auth Context & State (`context/AuthContext.tsx`)
- Provides `user`, `isAuthenticated`, `isLoading`, `login()`, `register()`, `googleLogin()`, `logout()`, `logoutAll()`.
- Access Token stored in-memory (React State) to prevent XSS exfiltration.

### 8.2 API Client & 401 Interceptor (`lib/api/client.ts`)
- Automatically attaches `Authorization: Bearer <access_token>` to every outgoing request.
- Automatically handles `401 Unauthorized` via silent token refresh and request replay queue.

### 8.3 AI Frontend Components & Hooks
- **`useVoiceRecognition` Hook**:
  - Wraps browser `SpeechRecognition` / `webkitSpeechRecognition`.
  - Supports locale switching (`mr-IN`, `hi-IN`, `en-IN`).
  - Emits real-time transcription to auto-trigger `/api/ai/parse-expense`.
- **`ReceiptScannerModal` (`components/ai/ReceiptScannerModal.tsx`)**:
  - Drag-and-drop or camera capture preview.
  - Shows animated scanning indicator with Titanium & Ice Blue laser effect.
  - Pre-fills `ExpenseForm` fields directly with parsed data upon confirmation.
- **`KharchaMitraDrawer` (`components/ai/KharchaMitraDrawer.tsx`)**:
  - Floating action button on dashboard triggering a sleek sliding drawer.
  - Supports Markdown rendering, quick question pills, and suggested deep links.
- **`AIInsightsCard` (`components/dashboard/AIInsightsCard.tsx`)**:
  - Rendered on `/` dashboard displaying proactive velocity alerts and savings opportunities.

---

## 9. Security, Privacy & AI Guardrails

1. **Password Security**: Passwords hashed using PBKDF2 / BCrypt (`rounds=12` or 100k iterations). Plaintext passwords never stored or logged.
2. **Token Security**:
   - Short-lived Access Tokens (15 min) with cryptographic HS256 verification.
   - Long-lived Refresh Tokens (30 days) stored exclusively in `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
   - Database stores only SHA-256 hashes (`token_hash`) with automatic replay detection.
3. **Multi-Tenancy & Authorization**:
   - Backend never accepts `user_id` from client payloads.
   - All database queries and AI context aggregations strictly filter by `Resource.user_id == current_user.id`.
4. **AI Privacy & Zero-PII Policy**:
   - Prompts sent to Google Gemini are sanitized. User full names, emails, and account credentials are **never included** in prompts.
   - In-memory processing: Receipt images are streamed to the Gemini API as temporary byte streams in memory and immediately discarded. No images are saved to local disks or public S3 buckets.
   - Google Gemini API enterprise terms: User data transmitted via developer API is not used to train base foundation models.
5. **Rate Limiting & Cost Guardrails**:
   - Slowapi rate limits applied to AI endpoints:
     - `/api/ai/scan-receipt`: 10 requests / minute per user.
     - `/api/ai/chat`: 20 requests / minute per user.
     - `/api/ai/parse-expense`: 15 requests / minute per user.
6. **Graceful Fallback**:
   - In the event of AI API downtime, network latency, or quota exhaustion, UI alerts display: *"AI processing temporarily unavailable. You can enter details manually."* The core CRUD system continues working without interruption.

---

## 10. Verification & Automated Test Plan

| Scope | Test Target | Verification Method |
|---|---|---|
| **Registration & Auth** | `/api/auth/*` | Pytest & live API tests verifying account creation, duplicate email rejection, starter category seeding, and token rotation |
| **Data Isolation** | Multi-User CRUD | Verify User A cannot access User B's expenses, categories, or budgets (404 returned) |
| **Receipt Scanner** | `POST /api/ai/scan-receipt` | Pytest test with mock Gemini Vision response validating JSON field mapping (amount, date, merchant, category) |
| **Natural Language Parser** | `POST /api/ai/parse-expense` | Pytest test verifying Marathi and English phrase parsing into structured expense dictionary |
| **KharchaMitra Chat** | `POST /api/ai/chat` | Pytest test verifying multi-tenant context boundary (User B cannot query User A's expenses through AI chat) |
| **Insights & Velocity** | `GET /api/ai/insights` | Pytest test asserting mathematical spending velocity calculation and budget overrun warning generation |
| **Frontend Production Build** | Next.js App Router | `npm run build` validating all pages, AI components, and hooks compile with 0 TypeScript/ESLint errors |

---

*Document Version: 3.0*  
*Status: Approved — Implementation-Ready AI Architecture*
