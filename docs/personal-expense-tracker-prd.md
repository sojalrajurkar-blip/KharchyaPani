# Product Requirements Document (PRD)
## Personal Expense Tracker (KharchyaPani)

---

## 1. Product Overview

**KharchyaPani** (Personal Expense Tracker) is a modern, responsive, web-based application that allows individuals to record, manage, and understand their personal expenses and budgets with bank-grade security and complete privacy.

The application is fully dynamic, database-driven, and multi-tenant at the user level:
- Every user registers and logs in with their own account (or signs in with Google).
- Every user's financial data (expenses, custom categories, daily/monthly budgets, and dashboard statistics) is completely isolated to their private account.
- Zero business data — categories, expenses, totals, or summaries — is ever hardcoded into the application.
- There is **no RBAC/admin system**: each authenticated user has complete, autonomous control over their own financial records and zero visibility or access to any other user's records.

---

## 2. Problem Statement

Individuals often spend money across various daily activities (food, travel, bills, shopping) without maintaining a structured, accurate log. Without an intuitive, secure, and accessible tool, it is difficult to answer critical questions:
- *"How much money have I spent today and this month?"*
- *"Am I staying within my daily or monthly budget?"*
- *"Which categories consume the bulk of my spending?"*
- *"Can I access my private financial records securely across my phone and laptop?"*

**KharchyaPani** solves this by providing a frictionless, multi-device, PWA-enabled personal expense tracking system with robust authentication, intuitive budgeting, and real-time visual summaries.

---

## 3. Product Goal

The application allows authenticated users to:

- Securely register and sign in via Email/Password or **Sign in with Google** (OAuth 2.0 / OpenID Connect).
- Manage account security (Forgot Password, Reset Password, Change Password, and Multi-device Logout).
- Add, view, edit, and delete personal expenses with payment modes and quick increment pills.
- Create and manage personalized expense categories with automatic inline integration.
- Set and track Daily and Monthly spending budgets with live progress bars.
- Filter, search, and review historical expenses.
- View interactive dashboard metrics, category breakdown pie charts, and recent spending trends.
- Access their account seamlessly as an installable Progressive Web App (PWA).

All data is persistently stored and dynamically scoped to the authenticated user.

---

## 4. Target User

The target user is any individual who wants a secure, private, and fast way to track and manage their personal expenses and budgets.

- **Account Model**: Individual private accounts.
- **Role Model**: Zero RBAC or administrative hierarchy. Every user is the sole owner and administrator of their own financial data.

---

## 5. Product Scope

### In Scope (Current Release)
- **Authentication & Security**:
  - Sign Up / Registration (Email + Password)
  - Sign In / Login (Email + Password)
  - Sign In with Google (OAuth 2.0 / OpenID Connect)
  - Secure Logout (Current session and All devices/sessions)
  - Forgot Password & Reset Password workflows
  - Change Password (for authenticated users)
  - JWT-based authentication with short-lived Access Tokens and HttpOnly Refresh Token rotation
- **User Data Isolation**:
  - Strict multi-tenancy: every expense, category, budget, and summary is strictly scoped to the authenticated user.
  - Zero cross-user data leakage.
- **Expense Management**:
  - Add Expense with amount, category, date, payment mode (Cash, UPI, Card, Net Banking), and optional note
  - Edit & Delete personal expenses
  - Filter by category, payment mode, date, and keyword search
- **Dynamic Category Management**:
  - Create, view, edit, and delete personal categories
  - Starter default categories seeded for new user accounts
  - Inline category creation and renaming directly within expense forms
  - Category deletion safeguards (prevent deleting categories with linked expenses)
- **Budget Management**:
  - Daily and Monthly budget limits
  - Real-time spend vs. limit calculations and visual progress indicators
- **Dashboard & Analytics**:
  - Today, Monthly, and All-Time total spending aggregates
  - Interactive Recharts Category Breakdown Pie Chart
  - Recent expenses table and quick action shortcuts
- **Progressive Web App (PWA)**:
  - Installable mobile/desktop app with offline asset caching and custom install prompt

### Out of Scope
- Role-Based Access Control (RBAC) or Admin dashboards (explicitly not needed)
- Multi-user joint/shared family wallets or corporate expense approval hierarchies
- Payment gateway integrations or bank account scraping
- AI spending forecasting / automated receipt OCR (planned for future phases)
- Complex multi-currency conversion (INR standard for current scope)

---

## 6. Product Features

### 6.1 Authentication & Account Management
- **Sign Up**: Users can register with their Full Name, Email, and a secure Password.
- **Sign In**: Fast login using verified credentials returning short-lived JWT Access Tokens and setting HttpOnly Refresh Tokens.
- **Google Sign-In**: 1-click authentication using Google OAuth 2.0. Automatically links accounts or provisions a new user profile with verified email.
- **Password Recovery**: Self-service Forgot Password flow sending a secure, time-limited reset token, enabling password updates without exposing account details.
- **Session Control**: Users can log out of the current device or invalidate all active sessions across all devices simultaneously.

### 6.2 Strict User Data Isolation
- Authorization is strictly enforced on the backend from verified JWT identities.
- The system never accepts or trusts a client-supplied `user_id`.
- User A can never read, modify, or delete records belonging to User B.

### 6.3 Expense Management
- Users can log an expense with:
  - Amount (> ₹0, supporting 2 decimal places)
  - Category (dynamic selection from user's categories)
  - Expense Date (with quick-select pills: Today, Yesterday, 2 Days Ago)
  - Payment Mode (`Cash`, `UPI`, `Card`, `Net Banking`)
  - Note / Description (optional, up to 500 characters)
- Full CRUD operations with instant UI feedback and zero data loss on modal interactions.

### 6.4 Category Management
- Categories are completely user-owned and dynamic.
- Users can create, rename, and delete custom categories.
- New categories immediately appear in forms and filter dropdowns without application reloads or code changes.

### 6.5 Daily & Monthly Budgeting
- Users can configure daily and monthly spending limits.
- The system calculates active spend against calendar-month boundaries to prevent leakage across billing cycles.
- Visual alerts and color-coded progress bars warn when approaching or exceeding limits.

### 6.6 Interactive Dashboard & History
- Real-time financial summary cards (Today's Spend, This Month's Spend, Total Expenses).
- Interactive Category Breakdown Pie Chart with animated tooltips.
- Multi-filter Expense History list supporting keyword search, category filtering, payment mode filtering, and date range filters.

---

## 7. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| **FR-1** | User can register a new account with Name, Email, and Password | P0 |
| **FR-2** | User can log in with valid Email and Password to receive JWT credentials | P0 |
| **FR-3** | User can authenticate seamlessly via Google OAuth 2.0 / OpenID Connect | P0 |
| **FR-4** | User can log out securely (clearing session cookies and revoking refresh tokens) | P0 |
| **FR-5** | User can log out from all active devices/sessions simultaneously | P0 |
| **FR-6** | User can initiate password reset via email and complete password update | P0 |
| **FR-7** | Authenticated user can change their password using their current password | P0 |
| **FR-8** | System automatically rotates Refresh Tokens and refreshes expired Access Tokens | P0 |
| **FR-9** | All API operations strictly enforce user data ownership derived from JWT tokens | P0 |
| **FR-10** | User can add, view, edit, and delete their own expenses | P0 |
| **FR-11** | User can select payment mode (Cash, UPI, Card, Net Banking) for each expense | P0 |
| **FR-12** | User can create, view, edit, and delete their own categories | P0 |
| **FR-13** | System blocks category deletion if linked expenses exist (with 409 Conflict) | P0 |
| **FR-14** | User can set and monitor Daily and Monthly budget limits | P0 |
| **FR-15** | Dashboard displays live user spending totals, category pie chart, and budget progress | P0 |
| **FR-16** | User can filter expenses by category, payment mode, date, and search notes | P0 |
| **FR-17** | Application functions as an installable Progressive Web App (PWA) | P0 |

---

## 8. Data Model & Entity Overview

### User
- `id`: Primary key (Integer or UUID)
- `email`: Required, unique, normalized lowercase
- `hashed_password`: Required for email/password users; nullable for pure Google OAuth users
- `full_name`: Required
- `is_active`: Boolean flag
- `is_verified`: Boolean flag
- `google_id`: Optional unique identifier for linked Google accounts
- `created_at` / `updated_at`: Timestamps

### RefreshToken
- `id`: Primary key
- `user_id`: Foreign key → User (Cascade Delete)
- `token_hash`: SHA-256 hash of the issued refresh token (Plain tokens are never stored)
- `expires_at`: Expiration timestamp
- `revoked_at`: Revocation timestamp (null if active)
- `user_agent`: Optional client metadata
- `ip_address`: Optional client IP
- `created_at`: Timestamp

### Category
- `id`: Primary key
- `user_id`: Foreign key → User
- `name`: Required, 1–100 characters (Unique per user)
- `created_at`: Timestamp

### Expense
- `id`: Primary key
- `user_id`: Foreign key → User
- `amount`: Required, numeric (> 0, 2 decimal places)
- `category_id`: Required, foreign key → Category
- `expense_date`: Required, valid date
- `payment_mode`: Required (`Cash`, `UPI`, `Card`, `Net Banking`)
- `note`: Optional, up to 500 characters
- `created_at` / `updated_at`: Timestamps

### Budget
- `id`: Primary key
- `user_id`: Foreign key → User
- `period_type`: Required (`daily` | `monthly`)
- `category_id`: Optional foreign key → Category
- `amount_limit`: Required, numeric (> 0)
- `created_at` / `updated_at`: Timestamps

---

## 9. Security & Privacy Requirements

1. **Zero Plaintext Passwords**: Passwords hashed using standard BCrypt or Argon2 algorithms with high cost factor.
2. **Token Security**:
   - Short-lived Access Tokens (10–15 minutes) kept in client application memory.
   - Long-lived Refresh Tokens (7–30 days) stored exclusively in `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
   - Server-side Refresh Token Rotation: every refresh invalidates the old token and issues a new pair.
   - Immediate revocation of all user tokens if token reuse is detected.
3. **Multi-Tenancy & Authorization**:
   - Every protected API endpoint inspects the cryptographically signed JWT.
   - Database queries strictly filter by `user_id == current_user.id`.
   - Accessing another user's resource returns `404 Not Found` (to avoid resource enumeration) or `403 Forbidden`.
4. **Rate Limiting**:
   - Login, Registration, and Password Reset endpoints protected against brute-force attacks via IP-based and user-based rate limits.
5. **No Secrets in Frontend or Code**:
   - JWT secret keys, Google OAuth client secrets, and database credentials remain strictly in server environment variables.

---

## 10. Application Pages & Navigation

1. **`/login`** — Modern sign-in page with Email/Password and Google 1-tap sign-in.
2. **`/register`** — User registration page with password strength validation and Google sign-in.
3. **`/forgot-password`** & **`/reset-password`** — Password recovery and reset interface.
4. **`/` (Dashboard)** — Authenticated home overview with stats, budget card, pie chart, and recent items.
5. **`/expenses`** — Full expense history with real-time multi-filter bar and quick actions.
6. **`/expenses/new` & `/expenses/[id]/edit`** — Expense creation/editing form with quick pills and inline category creation.
7. **`/categories`** — Category management screen.
8. **`/budgets`** — Daily and monthly budget limit configuration.

---

*Document Version: 2.0*  
*Status: Approved — Multi-User Authentication & Data Isolation*
