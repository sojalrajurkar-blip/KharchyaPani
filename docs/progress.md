# KharchyaPani — Project Progress & Comprehensive Development State

**Last Updated**: 2026-09-03  
**Version**: 2.2 (Dynamic Production Client Origin & Password Reset Link Resilience Complete)  
**Status**: 33/33 Pytest Test Suites Passing (100%), Next.js 14 Production Build (13/13 Routes) Passing (100%)  
**Repository**: [sojalrajurkar-blip/KharchyaPani](https://github.com/sojalrajurkar-blip/KharchyaPani.git)  
**Live Backend Contract**: FastAPI REST APIs on `http://localhost:8000` (Render Cloud Ready: `https://kharchyapani-api.onrender.com`)  
**Live Frontend**: Next.js 14 App Router on `http://localhost:3000` (Vercel Ready)

---

## 1. Executive Summary

**KharchyaPani** is a modern, responsive, database-driven Personal Expense Tracker and Daily/Monthly Budgeting Progressive Web Application (PWA). Built strictly following the 65 AI engineering rules outlined in `Agents.md`, PRD v2.0, and SRS v2.0.

### Core Architectural Layering
```
[ Next.js 14 App Router (AuthContext, 401 Interceptor, Titanium & Ice Blue Theme) ]
                                    │
                                    ▼ (REST API / Bearer JWT + HttpOnly Cookie)
             [ FastAPI (Python 3.8+, Pydantic v2, PBKDF2, HS256 JWT) ]
                                    │
                                    ▼ (SQLAlchemy ORM + Connection Pooling)
         [ PostgreSQL / Supabase (Strict Multi-Tenant Scoping via user_id FKs) ]
```

---

## 2. Completed Milestones & Feature Breakdown

### A. Authentication & Security Engine (FastAPI + JWT + OAuth 2.0)
- **Token Lifecycle & Storage Architecture**:
  - **Short-Lived Access Token**: 15 minutes, stored in-memory on the client (never in localStorage).
  - **Long-Lived Refresh Token**: 30 days, stored in a Secure, HttpOnly, SameSite cookie (`kharchyapani_refresh_token`).
  - **Refresh Token Rotation & SHA-256 Hashing**: Refresh tokens are cryptographically hashed before database persistence. Every refresh call rotates the token and revokes the old one. Replay detection automatically invalidates compromised sessions.
  - **Session Revocation**: Single-device logout and multi-device logout (`POST /api/auth/logout-all`).
- **User Models & Schemas**:
  - `users`: `id` (PK), `email` (unique index), `hashed_password` (nullable for OAuth-only users), `full_name`, `is_active`, `is_verified`, `created_at`, `updated_at`.
  - `refresh_tokens`: `id` (PK), `user_id` (FK), `token_hash` (unique index), `expires_at`, `revoked_at`, `created_at`, `user_agent`, `ip_address`.
  - `password_reset_tokens`: `id` (PK), `user_id` (FK), `token_hash` (unique index), `expires_at`, `used_at`, `created_at`.

### B. Email Delivery Service (Local SMTP + Production Resend API)
- **Dual Provider Architecture** (`app/services/email_service.py`):
  - **Local Development**: SMTP support (Gmail 16-digit App Password, Mailpit, Mailhog). Verified real email dispatching.
  - **Production Hosting**: Resend REST API integration supporting both custom verified domains and unverified testing sender (`EMAIL_FROM=onboarding@resend.dev` + `RESEND_API_KEY`).
  - **Non-blocking Dispatch**: Uses FastAPI `BackgroundTasks` to send emails asynchronously without delaying HTTP response times.
  - **Responsive Branded HTML Templates**: Titanium & Glowing Ice Blue dark aesthetic for **Welcome Aboard! 🚀** and **Password Reset Instructions** (1-hour time limit).

### C. Strict Multi-Tenant User Data Isolation
- **Tenant Scoping Architecture**: Zero RBAC/admin concepts. Every user operates inside an isolated sandbox scoped strictly by `user_id`.
- **Database Schema Migration**:
  - `categories`: Unique index on `(user_id, lower(name))` preventing duplicate category names per user. Auto-seeds 8 starter categories upon registration.
  - `expenses`: Scoped to `user_id`, validates category ownership before expense creation/updates.
  - `budgets`: Scoped to `user_id`, composite unique index on `(user_id, period_type, category_id)`.
  - `dashboard`: Real-time analytics, pie charts, and monthly totals calculated strictly from `current_user.id`.

### D. Frontend Authentication & Resilient UX Layer (Next.js 14)
- **Token Management & Interceptor** (`lib/api/client.ts`):
  - In-memory access token storage with automatic `401 Unauthorized` interceptor and request queuing.
  - All requests use `credentials: 'include'` for secure cookie handling across domains.
- **Global Auth State** (`context/AuthContext.tsx`):
  - React Context managing `user`, `isAuthenticated`, `isLoading`, `login`, `register`, `googleLogin`, `logout`, `logoutAll`, and `changePassword`.
- **Route Protection** (`components/auth/AuthGuard.tsx`):
  - Protects `/`, `/expenses`, `/categories`, and `/budgets` with sleek Titanium & Ice Blue skeleton spinner during verification.
- **Auth Pages & Resilient UX Improvements**:
  - `app/login/page.tsx`: Sign-in form with password toggle, forgot password link, and Google Sign-In.
  - `app/register/page.tsx`: Registration form with real-time password strength meter and account creation.
  - `app/forgot-password/page.tsx`: Self-service password recovery flow with instant "Didn't receive it? Resend Email" button.
  - `app/reset-password/page.tsx`: Token parsing, password validation, and dynamic "Resend / Request New Link" action banner when tokens expire or are invalid.

---

## 3. Environment Configuration & Production Readiness

All configuration is strictly environment-driven (Rule 9):

### Backend (`backend/.env.example` / `backend/.env`)
```bash
APP_ENV=development # or 'production' on Render
APP_PORT=8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kharchyapani_db
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
JWT_SECRET_KEY=generate-a-secure-random-64-character-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
RATE_LIMIT_ENABLED=True

# Email Delivery (Gmail SMTP or Resend REST API)
EMAIL_PROVIDER=auto
EMAIL_FROM_NAME=KharchyaPani
# For Resend (Production):
EMAIL_FROM=onboarding@resend.dev
RESEND_API_KEY=re_123456789_abcdefg
# For Gmail SMTP (Local):
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_TLS=True
SMTP_SSL=False
```

### Frontend (`frontend/.env.example` / `frontend/.env.local`)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 # or https://kharchyapani-api.onrender.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

---

## 4. Summary of Verification Status

| Component | Status | Verification Detail |
|---|---|---|
| **Backend Unit & Isolation Tests** | PASSED (22/22) | `pytest backend/tests` (Auth, Isolation, Expenses, Categories, Budgets, Dashboard, Email) |
| **Frontend Production Build** | PASSED (13/13) | `npm run build` (Static page generation, route verification, TypeScript checks) |
| **Email Service (SMTP & Resend)** | VERIFIED LIVE | Real Welcome Email dispatched via Gmail SMTP to recipient inbox |
| **Password Hashing & Token Rotation** | VERIFIED | PBKDF2 (100k rounds) + SHA-256 database hashing, single-use rotation |
| **Multi-Tenant Isolation** | VERIFIED | 100% scoped queries by `user_id`, 404 on foreign tenant access |
| **Auth UX Error Resilience** | VERIFIED | Direct Resend actions on expired tokens and recovery pages |
| **Zero Hardcoding** | VERIFIED | 100% environment-driven configuration |
