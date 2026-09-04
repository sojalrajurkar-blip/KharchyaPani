# Repo Memory — KharchyaPani

This document is the persistent repository memory for AI coding agents working on KharchyaPani.

## 1. Project Identity & Architecture
- **Application**: KharchyaPani (Personal Expense Tracker & Budgeting PWA)
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons, Titanium & Ice Blue Modern Dark theme (`#080c14` background, `#38bdf8` ice blue accents).
- **Backend**: FastAPI (Python 3.8+), Pydantic v2 (`SettingsConfigDict`, `ConfigDict`), SQLAlchemy ORM, Alembic migrations.
- **Database**: PostgreSQL (with strict tenant isolation via `user_id` FK).
- **API Pattern**: `Next.js -> lib/api/client.ts -> FastAPI (/api/*) -> SQLAlchemy -> PostgreSQL`. No direct frontend-to-DB calls.

## 2. Authentication & Security Engine (v2.0)
- **Token Architecture**:
  - **Access Token**: Short-lived (15 min), stored strictly in memory (`inMemoryAccessToken` in `lib/api/client.ts`), never in `localStorage`.
  - **Refresh Token**: Long-lived (30 days), stored in a `Secure`, `HttpOnly`, `SameSite=lax` cookie named `kharchyapani_refresh_token`.
  - **Rotation & Hashing**: Refresh tokens are cryptographically hashed using SHA-256 before database storage in `refresh_tokens`. Every refresh call rotates the token and revokes the previous one.
  - **Replay / Breach Detection**: Revoked token reuse is detected and blocked with 401 Unauthorized.
  - **Password Security**: PBKDF2 with SHA-256 (100,000 rounds) and unique salt per user.
  - **Google Sign-In**: OpenID Connect / ID Token flow (`POST /api/auth/google`) with public JWKS RSA signature verification.
  - **Session Management**: Single logout (`/api/auth/logout`) and all-devices logout (`/api/auth/logout-all`).
  - **Recovery**: Self-service `/api/auth/forgot-password` and `/api/auth/reset-password`.

## 3. Strict Multi-Tenant User Data Isolation
- **Rule**: There is NO RBAC/admin system in this application.
- Every authenticated user is strictly isolated. User A can NEVER view, mutate, link, or delete User B's categories, expenses, budgets, or dashboard stats.
- Foreign tenant access returns `404 Not Found`.
- Schema constraints:
  - `categories`: Composite unique index on `(user_id, lower(name))`.
  - `budgets`: Composite unique index on `(user_id, period_type, category_id)`.
  - `expenses`: Scoped to `user_id`, validates category ownership.

## 4. Key File Map
- **Backend Core**: `backend/app/core/config.py`, `backend/app/core/security.py`, `backend/app/db/base.py`, `backend/app/db/session.py`
- **Backend Models**: `backend/app/models/user.py`, `backend/app/models/category.py`, `backend/app/models/expense.py`, `backend/app/models/budget.py`
- **Backend Services**: `backend/app/services/auth_service.py`, `backend/app/services/expense_service.py`, `backend/app/services/category_service.py`, `backend/app/services/budget_service.py`, `backend/app/services/dashboard_service.py`
- **Backend AI Engine (v3.0)**: `backend/app/services/ai/base.py`, `backend/app/services/ai/gemini_provider.py`, `backend/app/services/ai/mock_provider.py`, `backend/app/services/ai/factory.py` (Outputs: 100% English)
- **Backend Routes**: `backend/app/api/routes/auth.py`, `backend/app/api/routes/expenses.py`, `backend/app/api/routes/categories.py`, `backend/app/api/routes/budgets.py`, `backend/app/api/routes/dashboard.py`, `backend/app/api/routes/ai.py`
- **Frontend API Layer**: `frontend/lib/api/client.ts` (with 401 auto-refresh interceptor), `frontend/lib/api/auth.ts`, `frontend/lib/api/expenses.ts`, `frontend/lib/api/categories.ts`, `frontend/lib/api/budgets.ts`, `frontend/lib/api/dashboard.ts`, `frontend/lib/api/ai.ts`
- **Frontend AI & Dynamic Components**: `frontend/components/ai/KharchaMitraDrawer.tsx` (Kharcha AI Copilot), `frontend/components/ai/ReceiptScannerModal.tsx` (OCR Scanner), `frontend/components/ai/VoiceExpenseInput.tsx` (Voice Auto-Parse), `frontend/components/dashboard/AIInsightsCard.tsx` (Velocity Forecast), `frontend/lib/utils/budgetMood.ts` (Dynamic Mood Avatars)
- **Frontend State & Guards**: `frontend/context/AuthContext.tsx`, `frontend/components/auth/AuthGuard.tsx`
- **Frontend Pages**: `frontend/app/page.tsx` (Dashboard), `frontend/app/login/page.tsx`, `frontend/app/register/page.tsx`, `frontend/app/forgot-password/page.tsx`, `frontend/app/reset-password/page.tsx`, `frontend/app/expenses/page.tsx`, `frontend/app/categories/page.tsx`, `frontend/app/budgets/page.tsx`
- **Documentation**: `docs/ai-features.md`, `docs/personal-expense-tracker-prd.md`, `docs/personal-expense-tracker-srs.md`, `PROGRESS.md`

## 5. Verification Commands & Health Status
- **Backend Pytest (39/39 tests)**: `backend\.venv\Scripts\pytest backend/tests`
- **Frontend Next.js Build (13/13 routes)**: `npm.cmd run build` inside `frontend/`
- **Current State**: 100% passing, English localized AI responses, Git synchronized with `origin/main`.

## 6. Upcoming Session Roadmap
- **Next Focus**: Comprehensive UI/UX overhaul across all screens and components (modern polish, micro-animations, glassmorphism refinement, and enhanced user interactions).
