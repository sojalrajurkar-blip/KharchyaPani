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
- **Backend Routes**: `backend/app/api/routes/auth.py`, `backend/app/api/routes/expenses.py`, `backend/app/api/routes/categories.py`, `backend/app/api/routes/budgets.py`, `backend/app/api/routes/dashboard.py`
- **Frontend API Layer**: `frontend/lib/api/client.ts` (with 401 auto-refresh interceptor), `frontend/lib/api/auth.ts`, `frontend/lib/api/expenses.ts`, `frontend/lib/api/categories.ts`, `frontend/lib/api/budgets.ts`, `frontend/lib/api/dashboard.ts`
- **Frontend State & Guards**: `frontend/context/AuthContext.tsx`, `frontend/components/auth/AuthGuard.tsx`
- **Frontend Pages**: `frontend/app/page.tsx` (Dashboard), `frontend/app/login/page.tsx`, `frontend/app/register/page.tsx`, `frontend/app/forgot-password/page.tsx`, `frontend/app/reset-password/page.tsx`, `frontend/app/expenses/page.tsx`, `frontend/app/categories/page.tsx`, `frontend/app/budgets/page.tsx`

## 5. Verification Commands
- **Backend Pytest (22/22 tests)**: `backend\.venv\Scripts\pytest backend/tests`
- **Frontend Next.js Build (13/13 routes)**: `npm.cmd run build` inside `frontend/`
