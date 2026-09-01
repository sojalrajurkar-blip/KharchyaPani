# Software Requirements Specification (SRS)
## Personal Expense Tracker (KharchyaPani)

---

## 1. Document Information

| Field | Value |
|---|---|
| Document Title | Software Requirements Specification — Personal Expense Tracker (KharchyaPani) |
| Source PRD | Personal Expense Tracker PRD, Version 2.0 (Approved — Multi-User Authentication & Data Isolation) |
| SRS Version | 2.0 |
| Status | Implementation-Ready |
| Intended Audience | AI coding agents, software engineering team, QA, DevOps |
| Technology Authority | This SRS (Section 10) is the authoritative source of truth for all architectural, technical, and security decisions. The PRD is the source of truth for product and business requirements. |

---

## 2. Purpose

This SRS defines the complete, implementation-ready technical specification for **KharchyaPani** with enterprise-grade authentication, multi-tenant user data isolation, and modern financial management features.

It specifies:
- Secure JWT authentication architecture with short-lived Access Tokens and HttpOnly Refresh Token rotation.
- **Sign in with Google** via OAuth 2.0 / OpenID Connect.
- Strict multi-tenant data ownership across all API endpoints and database models (Zero RBAC/Admin; complete per-user isolation).
- Full REST API contracts, database schemas, Alembic migrations, frontend/backend architecture, error handling, rate limiting, and automated testing strategies.

---

## 3. Scope

### 3.1 In Scope
- **Authentication & User Management**:
  - Sign Up / Registration (Email + Password with BCrypt hashing)
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
- **Progressive Web App (PWA)**:
  - Native Web App Manifest, Service Worker offline caching, and custom install prompt
- **DevOps & Testing**:
  - 100% automated test coverage with Pytest, Dockerfiles, and cloud deployment on Vercel & Render

### 3.2 Out of Scope
- Role-Based Access Control (RBAC) or Super-Admin portals (explicitly not needed)
- Joint/Shared group wallets or corporate approval hierarchies
- Payment gateways and direct bank account scraping
- AI-driven receipt OCR (reserved for future phases)

---

## 4. Technology Stack

| Layer | Technology | Version / Specification |
|---|---|---|
| Frontend Framework | Next.js (App Router) | 14.2+ |
| Frontend Language | TypeScript | 5.0+ |
| Styling & Theme | Tailwind CSS + Vanilla CSS | Titanium & Ice Blue Modern Dark Theme |
| Frontend Motion | Framer Motion | 11.0+ |
| Data Visualization | Recharts | 2.12+ |
| PWA Support | Service Worker + Web Manifest | Native Next.js 14 `manifest.ts` + `public/sw.js` |
| Backend Framework | FastAPI | 0.110+ |
| Backend Language | Python | 3.8+ / 3.11+ |
| Validation | Pydantic v2 | `pydantic-settings` (`SettingsConfigDict`) |
| ORM & Migrations | SQLAlchemy + Alembic | Declarative 2.0 style |
| Password Hashing | `passlib[bcrypt]` / `bcrypt` | 12 rounds / standard salt |
| JWT Tokens | `python-jose[cryptography]` / `PyJWT` | HS256 algorithm |
| Google OAuth | `google-auth` / OpenID Connect | Token verification via Google API |
| Rate Limiting | `slowapi` | In-memory / Redis-ready rate limiting |
| Database (Dev) | PostgreSQL / SQLite (Test) | Local PostgreSQL `localhost:5432` |
| Database (Prod) | Supabase PostgreSQL | Managed cloud instance |
| Frontend Hosting | Vercel | Production CDN & edge |
| Backend Hosting | Render | Web Service container |

---

## 5. System Architecture & Auth Flow

### 5.1 Architecture Diagram
```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js 14 Frontend                             │
│  - In-Memory Access Token (15 min)                                     │
│  - HttpOnly SameSite Refresh Token Cookie (30 day)                     │
│  - Axios/Fetch 401 Auto-Refresh Interceptor                            │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTPS REST (Bearer Token + Cookies)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FastAPI Backend Layer                           │
│  - get_current_user Security Dependency                                │
│  - Rate Limiter (Slowapi)                                              │
│  - Auth Router (/api/auth/*) & Resource Routers                        │
│  - Token Service (JWT generation, SHA-256 refresh token hashing)       │
│  - Google OAuth 2.0 / OpenID Connect Verifier                          │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ SQLAlchemy ORM
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database (Supabase)                       │
│  - users (id, email, hashed_password, google_id)                       │
│  - refresh_tokens (user_id, token_hash, expires_at, revoked_at)        │
│  - categories (user_id FK, name)                                       │
│  - expenses (user_id FK, amount, category_id, date, payment_mode)      │
│  - budgets (user_id FK, period_type, amount_limit)                     │
└────────────────────────────────────────────────────────────────────────┘
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
   - Backend verifies the presented refresh token against the hashed record in `refresh_tokens`:
     - If valid and unrevoked:
       - Old refresh token is marked revoked / rotated.
       - A new refresh token is generated, hashed, and stored.
       - A new access token is returned, and the new refresh token cookie is set.
     - If reuse of a revoked token is detected:
       - **Security Alarm**: Immediately revoke **all** active refresh tokens for that user. Return `401 Unauthorized`.
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
| `hashed_password` | VARCHAR(255) | NULLABLE | BCrypt hash (null for pure Google OAuth users) |
| `full_name` | VARCHAR(150) | NOT NULL | User's display name |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Account active status |
| `is_verified` | BOOLEAN | NOT NULL, DEFAULT FALSE | Email verification status |
| `google_id` | VARCHAR(255) | NULLABLE, UNIQUE, INDEX | Google OpenID identifier |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Registration timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Last update timestamp |

### 6.2 `refresh_tokens`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY GENERATED ALWAYS AS IDENTITY | Token ID |
| `user_id` | INTEGER | NOT NULL, FK → `users(id)` ON DELETE CASCADE | Owner User ID |
| `token_hash` | VARCHAR(64) | NOT NULL, UNIQUE, INDEX | SHA-256 hash of plain token string |
| `expires_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Expiration timestamp |
| `revoked_at` | TIMESTAMP WITH TIME ZONE | NULLABLE | Revocation timestamp (null if active) |
| `user_agent` | VARCHAR(500) | NULLABLE | Client browser/device metadata |
| `ip_address` | VARCHAR(45) | NULLABLE | Client IP address |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Issuance timestamp |

### 6.3 `password_reset_tokens`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY GENERATED ALWAYS AS IDENTITY | Token ID |
| `user_id` | INTEGER | NOT NULL, FK → `users(id)` ON DELETE CASCADE | Target User ID |
| `token_hash` | VARCHAR(64) | NOT NULL, UNIQUE, INDEX | SHA-256 hash of reset token |
| `expires_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Reset token expiry (e.g. 1 hour) |
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

#### `POST /api/auth/register`
- **Rate Limit**: 5 requests/minute per IP
- **Request Body**:
  ```json
  {
    "full_name": "Sojal Rajurkar",
    "email": "sojal@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "email": "sojal@example.com",
      "full_name": "Sojal Rajurkar"
    }
  }
  ```
- **Cookie**: Sets `refresh_token` (HttpOnly, Secure, SameSite=Lax, Max-Age=2592000)
- **Automatic Setup**: Auto-seeds default starter categories (`Food`, `Travel`, `Shopping`, `Bills`, `Health`, `Entertainment`, `Other`) for the newly registered user.
- **Errors**: `400 Bad Request` (Email already registered, weak password), `422 Unprocessable Entity`.

#### `POST /api/auth/login`
- **Rate Limit**: 10 requests/minute per IP
- **Request Body**:
  ```json
  {
    "email": "sojal@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "email": "sojal@example.com",
      "full_name": "Sojal Rajurkar"
    }
  }
  ```
- **Cookie**: Sets `refresh_token`.
- **Errors**: `401 Unauthorized` (Invalid email or password).

#### `POST /api/auth/google`
- **Request Body**:
  ```json
  {
    "credential": "GOOGLE_ID_TOKEN_STRING"
  }
  ```
- **Behavior**: Verifies token directly against Google's API. Finds existing user by Google ID or verified email. If user does not exist, provisions user account and starter categories.
- **Response `200 OK`**: Same token & user response as login + sets refresh token cookie.

#### `POST /api/auth/refresh`
- **Request**: Sent with `refresh_token` cookie.
- **Response `200 OK`**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer"
  }
  ```
- **Cookie**: Sets newly rotated `refresh_token`.
- **Errors**: `401 Unauthorized` (Missing, expired, revoked, or tampered token).

#### `POST /api/auth/logout`
- **Request**: Authenticated or with `refresh_token` cookie.
- **Behavior**: Marks the current refresh token as revoked in database and clears the cookie (`Max-Age=0`).
- **Response `200 OK`**: `{ "message": "Successfully logged out." }`

#### `POST /api/auth/logout-all`
- **Request**: Authenticated (`Authorization: Bearer <token>`).
- **Behavior**: Marks all active refresh tokens for the authenticated user as revoked in database and clears cookie.
- **Response `200 OK`**: `{ "message": "Successfully logged out from all devices." }`

#### `POST /api/auth/forgot-password`
- **Rate Limit**: 3 requests/minute per IP
- **Request Body**: `{ "email": "sojal@example.com" }`
- **Response `200 OK`**: `{ "message": "If an account exists, a password reset link has been generated." }`

#### `POST /api/auth/reset-password`
- **Request Body**:
  ```json
  {
    "token": "RESET_TOKEN_STRING",
    "new_password": "NewSecurePassword123!"
  }
  ```
- **Response `200 OK`**: `{ "message": "Password has been successfully reset." }`
- **Errors**: `400 Bad Request` (Invalid or expired reset token).

#### `POST /api/auth/change-password`
- **Request**: Authenticated (`Authorization: Bearer <token>`).
- **Request Body**:
  ```json
  {
    "current_password": "OldPassword123!",
    "new_password": "NewSecurePassword123!"
  }
  ```
- **Response `200 OK`**: `{ "message": "Password changed successfully." }`

#### `GET /api/auth/me`
- **Request**: Authenticated (`Authorization: Bearer <token>`).
- **Response `200 OK`**:
  ```json
  {
    "id": 1,
    "email": "sojal@example.com",
    "full_name": "Sojal Rajurkar",
    "created_at": "2026-08-31T12:00:00Z"
  }
  ```

---

### 7.2 User-Scoped Protected Endpoints

*All endpoints below require header `Authorization: Bearer <access_token>` and authoritatively scope database queries to `current_user.id`.*

#### Categories (`/api/categories`)
- `GET /api/categories`: Returns all categories owned by `current_user.id`.
- `POST /api/categories`: Creates category for `current_user.id`.
- `PUT /api/categories/{id}`: Updates category if owned by `current_user.id`. Returns `404` if not found or belongs to another user.
- `DELETE /api/categories/{id}`: Deletes category if owned by `current_user.id` and has 0 linked expenses. Returns `409 Conflict` if linked expenses exist.

#### Expenses (`/api/expenses`)
- `GET /api/expenses`: Returns expenses owned by `current_user.id` with optional filters (`category_id`, `payment_mode`, `date_from`, `date_to`, `search`).
- `POST /api/expenses`: Creates expense with `user_id = current_user.id`. Validates that referenced `category_id` belongs to `current_user.id`.
- `GET /api/expenses/{id}`: Returns expense if owned by `current_user.id`. Returns `404` otherwise.
- `PUT /api/expenses/{id}`: Updates expense if owned by `current_user.id`.
- `DELETE /api/expenses/{id}`: Deletes expense if owned by `current_user.id`.

#### Budgets (`/api/budgets`)
- `POST /api/budgets`: Upserts daily or monthly budget for `current_user.id`.
- `GET /api/budgets/status`: Calculates active daily and calendar-month spend vs limit for `current_user.id`.

#### Dashboard (`/api/dashboard`)
- `GET /api/dashboard`: Computes aggregated metrics (Today, Monthly, All-time totals, Category breakdown, Recent expenses) strictly for `current_user.id`.

---

## 8. Frontend Architecture & Token Interceptor

### 8.1 Auth Context & State (`context/AuthContext.tsx`)
- Provides `user`, `isAuthenticated`, `isLoading`, `login()`, `register()`, `googleLogin()`, `logout()`, `logoutAll()`.
- Access Token stored in-memory (React State) to prevent XSS exfiltration.

### 8.2 API Client & 401 Interceptor (`lib/api/client.ts`)
- Automatically attaches `Authorization: Bearer <access_token>` to every outgoing request.
- Automatically handles `401 Unauthorized`:
  - Enqueues pending requests.
  - Calls `POST /api/auth/refresh` (using credentials / HttpOnly cookie).
  - Updates in-memory Access Token.
  - Retries all pending requests seamlessly.
  - If refresh fails, redirects user gracefully to `/login`.

---

## 9. Security & Hardening Requirements

1. **Password Security**: Passwords hashed using standard BCrypt algorithm (`rounds=12`). Plaintext passwords never stored, logged, or serialized.
2. **Token Security**:
   - Short-lived Access Tokens (15 min) with cryptographic HS256 verification.
   - Long-lived Refresh Tokens (30 days) stored exclusively in `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
   - Plain refresh tokens never stored in database — only SHA-256 hashes (`token_hash`).
   - Strict Refresh Token Rotation: previous token revoked immediately upon refresh.
   - Breach detection: If an already-revoked refresh token is presented, all refresh tokens for that user are immediately invalidated.
3. **Data Isolation & Anti-Tampering**:
   - Backend never accepts `user_id` from client payloads.
   - Unauthorized attempts to access other users' entities return `404 Not Found` to prevent entity enumeration.
4. **CORS & CSRF**:
   - CORS strictly restricted to configured frontend origins with `allow_credentials=True`.
   - `SameSite=Lax` cookie configuration prevents CSRF attacks on refresh endpoints.
5. **Rate Limiting**:
   - Slowapi rate limits applied to `login` (10/min), `register` (5/min), and `forgot-password` (3/min).

---

## 10. Verification & Test Plan

| Scope | Test Target | Verification Method |
|---|---|---|
| **Registration** | `/api/auth/register` | Pytest & Live API tests verifying account creation, duplicate email rejection, starter category seeding, and token issuance |
| **Login & Password** | `/api/auth/login` | Pytest tests for valid password, wrong password rejection, and rate limiting |
| **Google Sign-In** | `/api/auth/google` | OpenID Connect token mock/live verification and account linking |
| **Token Rotation** | `/api/auth/refresh` | Verify access token renewal, refresh token hash update in DB, and old token invalidation |
| **Revocation** | `/api/auth/logout-all` | Verify all tokens for user are marked revoked and reject subsequent refresh requests |
| **Data Isolation** | Multi-User CRUD | Create User A and User B. Verify User A cannot read, modify, or delete User B's expenses or categories (404 returned) |
| **Frontend Build** | Next.js App Router | `npm run build` validating all auth pages, hooks, and protected routes compile cleanly |

---

*Document Version: 2.0*  
*Status: Approved — Implementation-Ready*
