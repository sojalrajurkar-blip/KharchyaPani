# Software Requirements Specification (SRS)
## Personal Expense Tracker

---

## 1. Document Information

| Field | Value |
|---|---|
| Document Title | Software Requirements Specification — Personal Expense Tracker |
| Source PRD | Personal Expense Tracker PRD, Version 1.0 (Draft — MVP Scope) |
| SRS Version | 1.0 |
| Status | Draft — Implementation-Ready |
| Intended Audience | AI coding agents, software development team, QA |
| Technology Authority | This SRS (Section 10) is the source of truth for all technology decisions. The PRD is the source of truth for all product/business requirements. |

---

## 2. Purpose

This SRS translates the Personal Expense Tracker PRD into a complete, implementation-ready technical specification. It defines the exact technology stack, database schema, API contract, frontend/backend architecture, folder structures, environment configuration, deployment process, testing strategy, and traceability back to every PRD requirement, so that an AI coding agent or development team can build the MVP without needing to make product or architectural judgment calls.

No PRD requirement is removed, simplified, or contradicted. Where the PRD leaves a decision open, it is explicitly flagged in Section 60 (Open Decisions / TBD) rather than silently resolved.

---

## 3. Scope

### 3.1 In Scope (MVP)
- Dashboard (total expense, expense count, recent expenses, category-wise summary)
- Add / Edit / Delete / View Expense
- Dynamic Category Management (Create / Read / Update / Delete)
- Filtering (category, date, date range, combined)
- Persistent storage via PostgreSQL (Supabase in production)
- REST API via FastAPI, consumed by a Next.js frontend
- Health and contact endpoints
- Basic security, validation, and error handling appropriate for a single-user, unauthenticated MVP

### 3.2 Out of Scope (Version 1)
Login/Register, authentication, AI features, payment gateway, notifications, real-time features, complex analytics, advanced budgeting, multi-user functionality, microservices, unnecessary third-party integrations. (See Section 58.)

---

## 4. Product Overview

Personal Expense Tracker is a web application for a single user to record, manage, and understand personal expenses. All business data — categories, expenses, totals, and summaries — is stored in and served from PostgreSQL via a FastAPI backend, and rendered by a Next.js frontend. Nothing is hardcoded: creating a category makes it immediately usable everywhere in the app with zero source-code changes.

---

## 5. Functional Requirements

Functional requirements are carried over verbatim from the PRD and are implemented exactly as specified.

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | User can add a new expense (amount, category, date, note) | P0 |
| FR-2 | User can view a list of all expenses | P0 |
| FR-3 | User can edit an existing expense | P0 |
| FR-4 | User can delete an expense (with confirmation) | P0 |
| FR-5 | User can create a new category | P0 |
| FR-6 | User can view all categories | P0 |
| FR-7 | User can edit a category | P0 |
| FR-8 | User can delete a category | P0 |
| FR-9 | New categories automatically appear in the Add/Edit Expense form | P0 |
| FR-10 | Dashboard shows total expense, expense count, recent expenses, and category-wise summary | P0 |
| FR-11 | User can filter expenses by category | P0 |
| FR-12 | User can filter expenses by date | P0 |
| FR-13 | User can filter expenses by date range | P0 |
| FR-14 | Total expense recalculates automatically after add/edit/delete | P0 |

### 5.1 Dynamic Data Requirement (carried from PRD Section 8)
The application must never hardcode categories, expense records, totals, counts, dashboard statistics, dropdown options, category summaries, user-created data, or business calculations. All such data must be loaded, stored, updated, and deleted dynamically through the database and API. Initial seed categories are permitted (Section 19) but must behave as ordinary, fully editable/deletable records after insertion.

---

## 6. Non-Functional Requirements

Carried from PRD Section 17, the application must be: simple, dynamic, maintainable, responsive, user-friendly, reliable, easy to understand, easy to extend, and free from unnecessary hardcoded business data. See also Section 53 (Performance), Section 52 (Security), and Section 54 (Logging) for concrete, testable elaborations of these qualities.

---

## 7. User Stories

- As a user, I want to add an expense so that I can record my spending.
- As a user, I want to edit an expense so that I can correct mistakes.
- As a user, I want to delete an expense so that incorrect records can be removed.
- As a user, I want to create categories so that I can organize my spending.
- As a user, I want to filter expenses so that I can find specific records.
- As a user, I want to see my total expenses so that I know how much I have spent.
- As a user, I want to see recent expenses so that I can quickly understand my latest spending.

---

## 8. User Flows

### 8.1 Add Expense (Primary Flow)
```
Open Application → Dashboard → Add Expense → Select/Create Category
→ Enter Amount → Select Date → Add Optional Note → Save
→ Expense appears in History → Dashboard statistics update
```

### 8.2 Edit Expense
```
Expense History → Select Expense → Edit → Update Fields → Save
→ History and Dashboard update
```

### 8.3 Delete Expense
```
Expense History → Select Expense → Delete → Confirm → Expense removed
→ History and Dashboard update
```

### 8.4 Create Category
```
Category Management → Add New Category → Enter Name → Save
→ Category available in Expense form
```

### 8.5 Edit Category
```
Category Management → Select Category → Edit → Update Name → Save
```

### 8.6 Delete Category
```
Category Management → Select Category → Delete → Confirm → Category removed
```

### 8.7 Filter Expenses
```
Expense History → Apply Filter (Category / Date / Date Range) → List updates dynamically
```

---

## 9. Application Pages

1. **Dashboard** — total expense, expense count, recent expenses, category-wise summary
2. **Add Expense** — form with amount, category (dynamic dropdown), date, note
3. **Edit Expense** — same form, pre-filled with existing values
4. **Expense History** — list/table of all expenses with filter controls and Edit/Delete actions
5. **Category Management** — create, view, edit, delete categories

The Add/Edit Expense screen loads available categories dynamically at runtime from the backend; the category list is never embedded in the UI at build time.

---

## 10. Technology Stack

This is the fixed, non-negotiable technology stack for this project. No substitutions.

| Layer | Technology |
|---|---|
| Frontend framework | Next.js (App Router) |
| Frontend language | TypeScript |
| Frontend animation | Framer Motion |
| Frontend architecture | Component-based |
| Backend language | Python |
| Backend framework | FastAPI |
| API style | REST |
| Backend validation | Pydantic |
| ORM | SQLAlchemy |
| Migrations | Alembic |
| Backend testing | Pytest |
| Database (dev) | PostgreSQL |
| Database (prod) | Supabase PostgreSQL |
| Frontend hosting | Vercel |
| Backend hosting | Render |
| Containerization | Dockerfiles only (no Compose, not required for dev) |

---

## 11. System Architecture

### 11.1 Logical Layers (technology-independent, carried from PRD Section 20)
- **User Interface Layer** — Dashboard, Add/Edit Expense, Expense History, Category Management screens
- **Application/Business Logic Layer** — expense/category operations, filtering logic, total calculation
- **Data Management Layer** — persistent storage and retrieval of Category and Expense records
- **Validation Layer** — enforces amount, category, date, and note rules before data is saved
- **Error Handling Layer** — captures and surfaces clear error messages across all operations
- **Configuration** — application-level settings, kept separate from business data

### 11.2 Concrete Architecture (Technical Decision)
```
Next.js (Vercel)  --HTTPS REST-->  FastAPI (Render)  --SQLAlchemy-->  PostgreSQL (Supabase)
```
The frontend never connects directly to PostgreSQL. All data access is mediated by the FastAPI backend.

---

## 12. Frontend Architecture

- Next.js App Router with TypeScript throughout.
- Component-based architecture: presentational components separated from data-fetching hooks/services.
- A single API service layer (`lib/api/`) wraps all HTTP calls to FastAPI; no component calls `fetch` directly.
- Client-side state kept local/component-level (React state + hooks); no global state library required for MVP (Technical Decision — MVP is small enough that Context/local state suffices; this can be revisited if future enhancements grow scope).
- Forms use controlled components with a shared validation utility mirroring backend Pydantic rules (Section 24).
- Framer Motion used for entrance/transition/feedback animations only (Section 28).

---

## 13. Backend Architecture

- FastAPI application with routers split by resource: `categories`, `expenses`, `dashboard`, `health`, `contact`.
- Pydantic schemas define request/response contracts and perform validation at the API boundary.
- SQLAlchemy models define the persistence layer; a service layer sits between routers and models to hold business logic (totals, filtering, category-in-use checks).
- Database sessions are provided via FastAPI dependency injection (`Depends(get_db)`), one session per request, closed after the request completes.
- Alembic manages all schema migrations; tables are never created via `create_all()` in production.
- Configuration is loaded from environment variables via a single `config.py` (e.g., using `pydantic-settings`).

---

## 14. Database Architecture

- Engine: PostgreSQL, accessed via SQLAlchemy's ORM (declarative models) and Core (for engine/session setup).
- Local development may run against a local PostgreSQL instance or a Supabase development project — either is acceptable as long as `DATABASE_URL` is configured (Technical Decision).
- Production uses Supabase PostgreSQL exclusively.
- All schema changes are applied through Alembic migrations, never manual DDL.

---

## 15. Database Schema

### 15.1 `categories`
| Column | Type | Constraints |
|---|---|---|
| id | INTEGER / SERIAL (or UUID — Technical Decision: INTEGER SERIAL for simplicity) | PRIMARY KEY |
| name | VARCHAR(100) | NOT NULL, UNIQUE |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() |

### 15.2 `expenses`
| Column | Type | Constraints |
|---|---|---|
| id | INTEGER / SERIAL | PRIMARY KEY |
| amount | NUMERIC(12,2) | NOT NULL, CHECK (amount > 0) |
| category_id | INTEGER | NOT NULL, FOREIGN KEY → categories(id) |
| expense_date | DATE | NOT NULL |
| note | VARCHAR(500) | NULLABLE |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now(), updated on modification |

### 15.3 Indexes (Technical Decision)
- `categories.name` — unique index (supports uniqueness constraint and lookup)
- `expenses.category_id` — index (supports filter-by-category and FK joins)
- `expenses.expense_date` — index (supports filter-by-date and date-range queries)

### 15.4 Note Character Limit
The PRD specifies "reasonable character limit" without a number. **Technical Decision:** 500 characters. This is not a PRD-mandated value; it may be revised without affecting product scope.

---

## 16. Entity Relationships

```
Category (1) ─────────< (Many) Expense
```
- Every Expense must reference an existing Category (`category_id` NOT NULL FK).
- Category `name` is unique.
- **Deleting a Category with linked Expenses: PRD explicitly leaves this undecided.** See Section 60 for the flagged open decision and the interim technical default.

---

## 17. SQLAlchemy ORM Specification

- **Models:** `Category` and `Expense` declarative models in `app/models/`, one file per model.
- **Relationships:** `Category.expenses` (one-to-many, `back_populates="category"`); `Expense.category` (many-to-one). Cascade behavior is tied to the Section 60 decision on category deletion — set to restrict/no-cascade delete by default so that deletion is blocked at the application layer, not silently cascaded (Technical Decision, pending confirmation of the PRD-flagged decision).
- **Sessions:** one `SessionLocal` per request via a `get_db()` FastAPI dependency (yield-based), ensuring the session is closed after each request.
- **Dependency Injection:** all routers receive `db: Session = Depends(get_db)`.
- **Transactions:** each write operation (create/update/delete) is wrapped in a single commit; on failure, the session is rolled back and a clear error is raised (Section 25).
- **Query approach:** simple, explicit ORM queries (`select`/`query` + filters); no raw SQL required for MVP scope. Filtering endpoints build queries incrementally by applying optional filters conditionally.
- **Connection handling:** a single SQLAlchemy `Engine` created at startup from `DATABASE_URL`, with connection pooling defaults appropriate for Render's environment (Technical Decision: modest pool size, e.g. `pool_size=5`, given single-user MVP scope).

---

## 18. Alembic Migration Strategy

- Alembic is initialized in `backend/alembic/` with `alembic.ini` at the backend root.
- **Initial migration:** creates `categories` and `expenses` tables with all constraints and indexes from Section 15.
- **Naming convention:** `YYYYMMDD_HHMM_short_description.py` (Technical Decision) generated via `alembic revision --autogenerate -m "short_description"`.
- **Schema versioning:** Alembic's built-in revision chain (`down_revision` links) is the single source of truth for schema history; no manual table creation is permitted.
- **Local execution:** `alembic upgrade head` run manually after configuring `DATABASE_URL` in `.env`.
- **Production execution (Render):** migrations are run as a pre-deploy / release step (Render "Pre-Deploy Command" or a one-off job running `alembic upgrade head`) before the new backend version starts serving traffic.
- **Future schema changes:** developers modify SQLAlchemy models, then run `alembic revision --autogenerate -m "..."`, review the generated migration, and commit it alongside the model change.

---

## 19. Database Seed Strategy

- A seed script (`backend/app/db/seed.py`) inserts the optional starter categories — Food, Travel, Shopping, Bills, Health, Entertainment, Other — **only if the `categories` table is empty**, to avoid duplicate-name errors on repeated runs.
- Seeding is invoked manually (`python -m app.db.seed`) after migrations, both locally and in production, and is never automatic on app startup (to keep behavior predictable and avoid unwanted writes on every deploy).
- Seeded categories carry no special flag or "system" status in the schema — once inserted, they are ordinary rows and fully editable/deletable, per PRD Section 8.

---

## 20. API Architecture

REST API served by FastAPI, versionless base path for MVP (Technical Decision: `/api/...`, no `/v1` prefix, given single-consumer MVP scope). Routers:

- `/api/categories` — Category CRUD
- `/api/expenses` — Expense CRUD + filtering
- `/api/dashboard` — dashboard aggregates
- `/health` — health check
- `/api/contact` — contact info

All list/aggregate responses are computed live from the database on each request; nothing is cached or precomputed in source code.

---

## 21. Complete API Contract

### 21.1 Categories

**POST `/api/categories`** — Create category
- Body: `{ "name": string (1-100 chars, required) }`
- Validation: name required, non-empty after trim, unique (case-insensitive comparison — Technical Decision)
- Success: `201 Created`
  ```json
  { "id": 1, "name": "Food", "created_at": "2026-08-26T10:00:00Z" }
  ```
- Errors: `409 Conflict` (duplicate name) — `{ "detail": "A category named 'Food' already exists." }`; `422 Unprocessable Entity` (validation failure)

**GET `/api/categories`** — List all categories
- Query params: none required
- Success: `200 OK`
  ```json
  [ { "id": 1, "name": "Food", "created_at": "2026-08-26T10:00:00Z" } ]
  ```

**GET `/api/categories/{id}`** — Get category by ID
- Path param: `id` (int)
- Success: `200 OK` — single category object
- Errors: `404 Not Found` — `{ "detail": "Category not found." }`

**PUT `/api/categories/{id}`** — Update category
- Path param: `id` (int); Body: `{ "name": string }`
- Success: `200 OK` — updated category object
- Errors: `404 Not Found`; `409 Conflict` (name collision); `422` (validation)

**DELETE `/api/categories/{id}`** — Delete category
- Path param: `id` (int)
- Success: `204 No Content` (only if no linked expenses, per Section 60 default)
- Errors: `404 Not Found`; `409 Conflict` — `{ "detail": "Cannot delete category with existing expenses.", "linked_expense_count": 4 }` (see Section 60)

### 21.2 Expenses

**POST `/api/expenses`** — Create expense
- Body:
  ```json
  { "amount": 250.00, "category_id": 1, "expense_date": "2026-08-26", "note": "Lunch" }
  ```
- Validation: amount required, numeric, > 0; category_id required and must reference an existing category; expense_date required, valid ISO date; note optional, ≤ 500 chars
- Success: `201 Created`
  ```json
  { "id": 10, "amount": 250.00, "category_id": 1, "expense_date": "2026-08-26", "note": "Lunch", "created_at": "2026-08-26T10:05:00Z", "updated_at": "2026-08-26T10:05:00Z" }
  ```
- Errors: `422` (validation, e.g. amount ≤ 0 or missing); `404` (`{ "detail": "Category not found." }` if category_id invalid)

**GET `/api/expenses`** — List expenses (with optional filtering)
- Query params: `category_id` (int, optional), `date` (ISO date, optional), `date_from` (ISO date, optional), `date_to` (ISO date, optional). Filters combine with AND.
- Success: `200 OK` — array of expense objects (each including nested or joined category name — Technical Decision: include `category_name` in the response for frontend convenience)

**GET `/api/expenses/{id}`** — Get expense by ID
- Success: `200 OK`; Errors: `404 Not Found`

**PUT `/api/expenses/{id}`** — Update expense
- Body: same shape as create (all fields re-validated)
- Success: `200 OK` — updated expense; `updated_at` refreshed
- Errors: `404` (expense or referenced category not found); `422` (validation)

**DELETE `/api/expenses/{id}`** — Delete expense
- Success: `204 No Content`
- Errors: `404 Not Found`

### 21.3 Dashboard

**GET `/api/dashboard`**
- Success: `200 OK`
  ```json
  {
    "total_expense": 4520.50,
    "expense_count": 18,
    "recent_expenses": [ { "id": 10, "amount": 250.00, "category_name": "Food", "expense_date": "2026-08-26", "note": "Lunch" } ],
    "category_summary": [ { "category_id": 1, "category_name": "Food", "total": 1200.00, "count": 6 } ]
  }
  ```
- "Recent expenses" limited to the 5 most recent by `expense_date`/`created_at` (Technical Decision — count not specified by PRD).
- All values computed live via SQL aggregation on each request.

### 21.4 Error Response Shape (all endpoints)
```json
{ "detail": "Human-readable message" }
```
Validation errors use FastAPI's default Pydantic `422` shape (`detail` array of field errors), which is acceptable and frontend-parseable.

---

## 22. Health Endpoint

**GET `/health`**
- Purpose: production liveness/readiness check used by Render to determine whether the backend instance is healthy.
- Behavior: verifies the process is running and performs a lightweight DB connectivity check (e.g. `SELECT 1`).
- Success: `200 OK` — `{ "status": "ok", "database": "connected" }`
- Failure: `503 Service Unavailable` — `{ "status": "error", "database": "unreachable" }` if the DB check fails.
- Never exposes credentials, stack traces, or internal connection details.

---

## 23. API Contact Endpoint

**GET `/api/contact`**
- Purpose: expose basic, non-sensitive contact/support information for the application.
- Request: no parameters.
- Response: `200 OK` — `{ "name": "<configured app/owner name>", "email": "<configured contact email>" }`, values sourced from environment configuration, not hardcoded.
- Never exposes secrets or internal infrastructure details.

---

## 24. Validation Specification

Validation exists at both layers; **backend (Pydantic) validation is authoritative** — frontend validation is a UX convenience only.

| Field | Rule | Frontend | Backend (Pydantic) |
|---|---|---|---|
| amount | required, numeric, > 0, 2 decimal places | inline error before submit | `condecimal(gt=0, decimal_places=2)` or equivalent |
| category_id | required, must reference existing category | dropdown only shows valid categories | FK existence check in service layer → `404` if missing |
| expense_date | required, valid date | native date input | `date` type validation |
| note | optional, ≤ 500 chars | character counter | `constr(max_length=500)` |
| category.name | required, unique, 1–100 chars | inline error | `constr(min_length=1, max_length=100)` + uniqueness check |

Validation error messages are clear, field-specific, and returned as structured JSON so the frontend can map them to the correct input.

---

## 25. Error Handling

Consistent handling across the backend using FastAPI exception handlers:

| Scenario | HTTP Status | Behavior |
|---|---|---|
| Invalid amount | 422 | Field-level message; entry not saved |
| Missing amount | 422 | Field-level message; entry not saved |
| Missing category | 422 | Field-level message; entry not saved |
| Invalid date | 422 | Field-level message; entry not saved |
| Category not found | 404 | Clear message; operation blocked |
| Expense not found | 404 | Clear message; operation blocked |
| Duplicate category | 409 | Clear message; category not created |
| Category delete blocked (linked expenses) | 409 | Clear message; deletion not performed |
| Invalid request (malformed body) | 400 | Generic clear message |
| Database failure | 500 | Generic message; no internal details leaked; error logged server-side |
| Unexpected server error | 500 | Generic message; logged with stack trace server-side only |

No response ever includes database credentials, passwords, stack traces, or internal implementation details.

---

## 26. UI/UX Specification

Interface qualities: clean, modern, simple, professional, user-friendly, accessible, responsive.

### 26.1 Dashboard
Shows Total Expense, Expense Count, Recent Expenses, Category-wise Summary. Includes loading states (skeletons), empty states (e.g. "No expenses yet — add your first one"), error states (retry affordance), and success feedback (toast on actions originating from this page).

### 26.2 Add/Edit Expense
Fields: Amount, dynamic category dropdown (fetched from `/api/categories`), Date, optional Note. Client-side validation mirrors Section 24. Save and Cancel/back actions.

### 26.3 Expense History
Expense list/table, category filter, date filter, date-range filter, Edit and Delete actions per row, delete confirmation modal.

### 26.4 Category Management
Category list, Add, Edit, Delete, confirmation modal, and explicit handling/messaging when deletion is blocked due to linked expenses (Section 60).

---

## 27. Responsive Design

The application must work on mobile, tablet, laptop, desktop, and large desktop. (Technical Decision breakpoints, Tailwind-style: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`.)

| Element | Behavior |
|---|---|
| Navigation | Collapses to a hamburger/menu on mobile; full nav bar from `md` up |
| Dashboard cards | Stack vertically on mobile; grid (2–4 columns) from `md` up |
| Tables/lists | Convert to stacked card rows on mobile to avoid horizontal scroll; full table from `md` up |
| Forms | Single-column on mobile; may use two-column layout on larger screens |
| Filters | Collapse into a filter drawer/accordion on mobile; inline row on desktop |
| Modals | Full-screen sheet on mobile; centered dialog on desktop |
| Buttons | Full-width on mobile; auto-width on desktop |

No unnecessary horizontal scrolling on mobile at any screen listed above.

---

## 28. Framer Motion Specification

Used for subtle, meaningful animation only:
- Page/route transitions (fade/slide, ~200–300ms)
- Dashboard card entrance (staggered fade-in on load)
- List item appearance/removal in Expense History (fade/height collapse)
- Modal/dialog open-close animation
- Success feedback (toast slide-in, checkmark micro-animation)
- Error feedback (shake or highlight on invalid field)
- Expand/collapse for filter panels

Animations are smooth, professional, lightweight, and performance-conscious. `prefers-reduced-motion` is respected — animations are disabled or minimized when the user's OS setting requests reduced motion.

---

## 29. Micro-interactions

- Button hover/press states
- Loading indicators (spinners) for in-flight requests
- Skeleton loading for dashboard cards and lists
- Inline validation feedback as the user types/blurs a field
- Save success feedback (toast)
- Delete confirmation (modal, explicit confirm action)
- Empty states for zero expenses/categories
- Smooth filter updates (no full page reload/flash)
- Toast notifications for create/update/delete outcomes

---

## 30. 3D Requirements

A lightweight 3D visual element is **optional** and only included if it adds meaningful UI value; it is never part of core business logic.

- **Where:** at most a small decorative element (e.g. a subtle animated icon/illustration on the Dashboard) — Technical Decision, may be omitted entirely for MVP without any loss of required functionality.
- **Purpose:** visual polish only.
- **Performance impact:** must be lightweight (e.g. a small, optimized asset or lightweight library such as a minimal Three.js scene); must not block initial page render.
- **Mobile fallback:** replaced with a static image/icon on low-power or small-viewport devices.
- **Accessibility:** decorative only, marked `aria-hidden="true"`, no essential information conveyed exclusively through the 3D element.
- The application is fully functional with the 3D element disabled or removed.

---

## 31. Frontend Folder Structure

```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  # Dashboard
│   ├── expenses/
│   │   ├── page.tsx               # Expense History
│   │   ├── new/page.tsx           # Add Expense
│   │   └── [id]/edit/page.tsx     # Edit Expense
│   └── categories/
│       └── page.tsx               # Category Management
├── components/
│   ├── dashboard/
│   ├── expenses/
│   ├── categories/
│   └── ui/                        # shared buttons, modals, inputs, toasts
├── layouts/
├── lib/
│   ├── api/                       # API service layer (fetch wrappers per resource)
│   ├── hooks/                     # useExpenses, useCategories, useDashboard, etc.
│   └── utils/
├── forms/
│   └── validation/                # shared validation schemas (mirrors backend rules)
├── types/                         # TypeScript types/interfaces (Expense, Category, DashboardSummary)
├── constants/
├── animations/                    # Framer Motion variants
├── styles/
├── public/                        # static assets
├── tests/
├── .env.example
├── .gitignore
├── Dockerfile
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## 32. Backend Folder Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app instance, router registration, CORS
│   ├── api/
│   │   └── routes/
│   │       ├── categories.py
│   │       ├── expenses.py
│   │       ├── dashboard.py
│   │       ├── health.py
│   │       └── contact.py
│   ├── schemas/                   # Pydantic request/response models
│   │   ├── category.py
│   │   └── expense.py
│   ├── models/                    # SQLAlchemy ORM models
│   │   ├── category.py
│   │   └── expense.py
│   ├── services/                  # business logic (totals, filtering, category-in-use checks)
│   │   ├── category_service.py
│   │   └── expense_service.py
│   ├── db/
│   │   ├── session.py             # engine, SessionLocal, get_db dependency
│   │   ├── base.py                # declarative base
│   │   └── seed.py
│   ├── core/
│   │   └── config.py              # environment-driven settings
│   ├── exceptions/                # custom exception classes + handlers
│   └── middleware/                # CORS, logging middleware
├── alembic/
│   ├── versions/
│   └── env.py
├── alembic.ini
├── tests/
│   ├── test_categories.py
│   ├── test_expenses.py
│   ├── test_dashboard.py
│   └── test_health.py
├── .env.example
├── .gitignore
├── Dockerfile
├── requirements.txt
└── pytest.ini
```

---

## 33. Environment Configuration

All environment-specific values are supplied via environment variables — never hardcoded. This includes database URL/credentials, backend/frontend URLs, ports, CORS origins, and any secrets.

---

## 34. Backend `.env.example`

```env
APP_ENV=development
APP_PORT=8000
DATABASE_URL=
DATABASE_USER=
DATABASE_PASSWORD=
CORS_ORIGINS=http://localhost:3000
CONTACT_NAME=
CONTACT_EMAIL=
```
No real secrets are ever committed. `DATABASE_URL` is the primary connection string used by SQLAlchemy; `DATABASE_USER`/`DATABASE_PASSWORD` are documented separately in case the deployment target requires them independently (e.g. constructing the URL at runtime).

---

## 35. Frontend `.env.example`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```
`NEXT_PUBLIC_`-prefixed variables are exposed to the browser by Next.js; only non-sensitive values (like the public API base URL) use this prefix. No secret should ever be placed in a `NEXT_PUBLIC_` variable.

---

## 36. Root `.gitignore`

```gitignore
# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
logs/

# Temp
*.tmp
.cache/
```

---

## 37. Backend `.gitignore`

```gitignore
.env
.venv/
venv/
__pycache__/
*.pyc
.pytest_cache/
.coverage
htmlcov/
*.log
```

---

## 38. Frontend `.gitignore`

```gitignore
.env
.env.local
node_modules/
.next/
out/
build/
*.log
coverage/
test-results/
```

---

## 39. Testing Strategy

### 39.1 Backend (Pytest)
Covers: API endpoints (all CRUD + filtering + dashboard), service-layer business logic, models/constraints, validation rules, error handling paths, and database behavior (using a dedicated test database or transactional rollback per test — Technical Decision).

### 39.2 Frontend
Uses a Next.js-compatible testing approach (Technical Decision: Jest + React Testing Library for components/forms, Playwright or Cypress for E2E). Covers: components, forms, validation, API integration (mocked), loading states, error states, user interactions.

### 39.3 End-to-End Functional Testing
1. Create category
2. Create expense
3. View expense
4. Edit expense
5. Delete expense
6. Filter expenses (category, date, date range, combined)
7. Verify dashboard update after each mutation
8. Edit category
9. Delete category (both unlinked and linked scenarios, per Section 60)
10. Invalid input handling
11. API error handling (404, 409, 422, 500 paths)

---

## 40. Local Development Without Docker

Docker is **not** required for development, local testing, or database setup.

1. Clone repository
2. Install frontend dependencies: `cd frontend && npm install`
3. Create Python virtual environment: `cd backend && python -m venv .venv && source .venv/bin/activate` (or `.venv\Scripts\activate` on Windows)
4. Install backend dependencies: `pip install -r requirements.txt`
5. Configure `.env` in both `frontend/` and `backend/` from their `.env.example` files
6. Configure PostgreSQL/Supabase development database and set `DATABASE_URL`
7. Run Alembic migrations: `alembic upgrade head`
8. Run seed if required: `python -m app.db.seed`
9. Start FastAPI normally: `uvicorn app.main:app --reload --port 8000`
10. Start Next.js normally: `npm run dev`
11. Verify `GET /health` returns `200 OK`
12. Verify frontend → backend communication (Dashboard loads data)
13. Test CRUD for expenses and categories manually or via automated tests
14. Test filtering
15. Test dashboard aggregates update after mutations
16. Run automated tests: `pytest` (backend), `npm test` (frontend)

Docker is not a prerequisite for any of these steps.

---

## 41. Docker Requirements

Docker is provided **only** as a containerization/deployment-readiness deliverable — not the primary development workflow. Docker Compose is not required. Only two independent Dockerfiles are required.

---

## 42. Backend Dockerfile Specification

`backend/Dockerfile` — capable of running the FastAPI backend in a container:
- Multi-stage build (Technical Decision): builder stage installs dependencies from `requirements.txt`; runtime stage copies the app and installed packages onto a slim Python base image.
- Accepts all configuration via environment variables (no hardcoded `DATABASE_URL`, ports, or secrets).
- Exposes the configured `APP_PORT` (default 8000).
- Runs via `uvicorn` (production-appropriate command, e.g. `uvicorn app.main:app --host 0.0.0.0 --port $APP_PORT`).
- Contains no secrets and does not modify business logic.

---

## 43. Frontend Dockerfile Specification

`frontend/Dockerfile` — capable of running the Next.js frontend in a container:
- Multi-stage build (Technical Decision): dependency-install stage, build stage (`next build`), and a slim runtime stage serving the production build (`next start`, or Next.js standalone output for a smaller image).
- Accepts `NEXT_PUBLIC_API_BASE_URL` and other config via environment/build args as appropriate to Next.js's build-time vs runtime env variable handling.
- Exposes port 3000 (or configurable).
- Contains no secrets.

---

## 44. Docker Verification

Docker is verified for readiness only, not used for day-to-day development or testing:
- Backend Dockerfile builds successfully and the container serves `/health` as `200 OK`.
- Frontend Dockerfile builds successfully and serves the app.
- Required dependencies are present in each image.
- Environment variables required by each container are documented (Sections 34–35).
- Container startup commands and exposed ports are correct.
- Production container configuration (e.g. non-root user, slim base image) is reasonable.

The developer is never required to use Docker to develop or test the application.

---

## 45. Supabase Configuration

- Supabase PostgreSQL is used for the production database.
- Database setup: create a Supabase project; obtain the connection string from the project's database settings.
- `DATABASE_URL` is set to the Supabase-provided connection string (including `sslmode=require` where applicable, per Supabase's connection requirements).
- Alembic migrations are run against the Supabase database using the same `alembic upgrade head` command, with `DATABASE_URL` pointed at Supabase.
- Seed strategy is identical to Section 19, run once against the production database.
- Database security: use Supabase's provided credentials scoped to the application; do not expose the Supabase service role key to the frontend; the frontend never receives any Supabase credentials, since it only talks to FastAPI.

---

## 46. Render Configuration

Deploy FastAPI to Render as a Web Service:
- Repository setup: connect the GitHub repository, root directory set to `backend/`.
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (Render injects `$PORT`)
- Environment variables: `DATABASE_URL`, `CORS_ORIGINS` (set to the Vercel frontend origin), `CONTACT_NAME`, `CONTACT_EMAIL`, and any others from Section 34
- Port configuration: Render provides `$PORT`; the app must bind to it rather than a hardcoded port
- CORS: `CORS_ORIGINS` includes the deployed Vercel URL
- Health check: Render's health check path set to `/health`
- Supabase connection: `DATABASE_URL` points to Supabase
- Alembic migration execution: run as a Render pre-deploy/release command (`alembic upgrade head`) before the new instance receives traffic
- Logs: viewable via the Render dashboard for production troubleshooting
- Deployment verification: confirm `GET /health` returns `200 OK` on the live Render URL

---

## 47. Vercel Configuration

Deploy Next.js to Vercel:
- Repository setup: connect the GitHub repository, root directory set to `frontend/`.
- Build configuration: Vercel auto-detects Next.js (`next build`).
- Environment variables: `NEXT_PUBLIC_API_BASE_URL` set to the live Render backend URL.
- Production API URL: confirmed reachable from the deployed frontend.
- Backend communication: verify the Dashboard and CRUD screens successfully call the Render API in production.
- Deployment verification: manually exercise the primary user flows (Section 8) against the live deployment.

---

## 48. CORS Configuration

CORS is entirely environment-driven via `CORS_ORIGINS`:
- **Local:** `CORS_ORIGINS=http://localhost:3000`
- **Production:** `CORS_ORIGINS=<deployed Vercel origin>`

No wildcard (`*`) production CORS is used without documented reason; for this single-frontend MVP, CORS is restricted to the exact configured origin(s).

---

## 49. Production Architecture

```
                 USER
                   │
                   ▼
              VERCEL
                   │
                   ▼
             NEXT.JS APP
                   │
              HTTPS REST API
                   │
                   ▼
               RENDER
                   │
                   ▼
              FASTAPI API
                   │
              SQLAlchemy
                   │
                   ▼
          SUPABASE POSTGRES
```

- **Vercel/Next.js:** renders the UI, handles client-side state and interaction, calls the FastAPI REST API over HTTPS. Never touches PostgreSQL directly.
- **Render/FastAPI:** validates requests, enforces business rules, executes SQLAlchemy queries, returns JSON.
- **Supabase/PostgreSQL:** durable storage for categories and expenses, accessed only by the backend.

---

## 50. Deployment Sequence

1. Configure Supabase PostgreSQL (create project, obtain connection string)
2. Configure database environment variables (`DATABASE_URL` etc.) in Render
3. Run Alembic migrations against Supabase (`alembic upgrade head`)
4. Run seed if required (`python -m app.db.seed`)
5. Test FastAPI locally against the Supabase connection before deploying
6. Deploy FastAPI to Render
7. Verify `GET /health` on the Render URL
8. Configure Vercel frontend `NEXT_PUBLIC_API_BASE_URL` to point at the Render URL
9. Deploy Next.js to Vercel
10. Configure production `CORS_ORIGINS` on Render to the live Vercel URL
11. Test the full path: `Vercel → Render → Supabase`
12. Run complete acceptance testing (Section 56) against production

---

## 51. Environment Matrix

| Variable | Local | Dockerfile Runtime | Render | Vercel |
|---|---|---|---|---|
| DATABASE_URL | set in `backend/.env` | passed as container env var | set in Render dashboard | N/A |
| DATABASE_USER | set in `backend/.env` (if used) | passed as container env var | set in Render dashboard (if used) | N/A |
| DATABASE_PASSWORD | set in `backend/.env` (if used) | passed as container env var | set in Render dashboard (if used) | N/A |
| CORS_ORIGINS | `http://localhost:3000` | passed as container env var | live Vercel origin | N/A |
| APP_PORT | `8000` | passed as container env var / `$PORT` | Render-injected `$PORT` | N/A |
| NEXT_PUBLIC_API_BASE_URL | `http://localhost:8000` | passed as build/runtime arg | N/A | live Render URL |

No real secret values appear in this SRS.

---

## 52. Security Requirements

Even though authentication is out of scope for the MVP:
- All secrets/config are environment-based, never committed.
- Backend validation is authoritative regardless of frontend validation state.
- Database connections use secure (SSL, where required by Supabase) connections.
- CORS is restricted to configured origins only.
- Error responses never leak credentials, stack traces, or internal details (Section 25).
- No credentials are ever committed to Git (Sections 36–38).
- The frontend never receives database credentials — it only talks to the backend API.
- Local, staging, and production configurations are kept separate via environment variables.
- Backend dependencies are kept up to date and free of known critical vulnerabilities (routine dependency review — Technical Decision, no specific tool mandated for MVP).
- Authentication is explicitly **not** added unless requirements are changed in a future version.

---

## 53. Performance Requirements

Reasonable MVP-level performance (no over-engineering):
- Database queries use the indexes defined in Section 15.3 to keep filter/dashboard queries efficient at MVP data volumes.
- Dashboard aggregates are computed via efficient SQL aggregation (`SUM`, `COUNT`, `GROUP BY`) rather than loading all rows into application memory.
- The frontend avoids unnecessary duplicate API requests (e.g. debounced filter inputs, avoiding redundant refetches).
- Loading states are shown for any request expected to take a noticeable amount of time.
- Next.js assets are optimized using standard framework defaults (image optimization, code splitting).
- Framer Motion animations are lightweight and do not block interaction.
- The app performs acceptably on mid-range mobile devices.
- Any optional 3D element (Section 30) remains lightweight and does not degrade core page performance.

---

## 54. Logging and Monitoring

Backend logs (via Python's standard `logging` module, structured where practical):
- Application startup (including successful DB connection)
- API errors (4xx/5xx with request context, excluding sensitive payload fields)
- Database connection problems
- Important failures (e.g. failed migrations, failed seed runs)

Never logged: passwords, secrets, database credentials, or other sensitive environment values. Production troubleshooting is performed via Render's log viewer; no additional monitoring infrastructure is required for MVP scope.

---

## 55. Implementation Phases

| Phase | Objective | Key Tasks | Dependencies | Expected Output | Verification |
|---|---|---|---|---|---|
| 1. Project Initialization | Scaffold repo | Create `frontend/`, `backend/`, root `.gitignore`, README | None | Empty runnable skeletons | Both apps start locally |
| 2. PostgreSQL + SQLAlchemy + Alembic | Set up persistence tooling | Configure engine/session, init Alembic | Phase 1 | Alembic configured, DB reachable | `alembic upgrade head` runs (no-op) |
| 3. Database Models | Define schema | Create `Category`, `Expense` SQLAlchemy models | Phase 2 | Models match Section 15 | Autogenerate migration matches schema |
| 4. FastAPI Configuration | App shell | `main.py`, config, CORS, exception handlers | Phase 3 | Runnable FastAPI app | `/health` returns 200 |
| 5. Category APIs | Category CRUD | Routers, schemas, service | Phase 4 | Endpoints per Section 21.1 | Pytest passes for categories |
| 6. Expense APIs | Expense CRUD | Routers, schemas, service | Phase 5 | Endpoints per Section 21.2 | Pytest passes for expenses |
| 7. Dashboard APIs | Aggregates | Dashboard router + service queries | Phase 6 | Endpoint per Section 21.3 | Pytest passes for dashboard |
| 8. Filtering | Query-param filters | Extend expense list endpoint | Phase 6 | Combined filters work | Pytest covers filter combinations |
| 9. Next.js Foundation | Frontend shell | App Router setup, API service layer, types | Phase 4 | Runnable Next.js app | Frontend loads, calls `/health` |
| 10. Dashboard UI | Build dashboard page | Cards, loading/empty/error states | Phase 7, 9 | Working Dashboard | Manual + component tests |
| 11. Expense Management UI | Add/Edit/History pages | Forms, table, delete confirm | Phase 6, 9 | Working expense flows | Manual + E2E tests |
| 12. Category Management UI | Category CRUD page | List, add/edit/delete, confirm | Phase 5, 9 | Working category flows | Manual + E2E tests |
| 13. Validation & Error Handling | Harden inputs | Frontend validation, error surfaces | Phases 5-12 | Consistent UX errors | Invalid-input tests pass |
| 14. Responsive Design | Adapt layouts | Breakpoints per Section 27 | Phases 10-12 | Works on all screen sizes | Manual device/viewport testing |
| 15. Framer Motion + Micro-interactions | Polish UX | Animations per Sections 28-29 | Phases 10-12 | Smooth, reduced-motion-aware UI | Manual QA |
| 16. Lightweight 3D | Optional decorative element | Add/verify fallback | Phase 10 | Non-blocking visual (optional) | Perf check, mobile fallback verified |
| 17. Testing | Full coverage | Pytest suite, frontend tests, E2E | All prior | Passing test suite | CI/manual test run green |
| 18. Separate Dockerfiles | Containerization readiness | `backend/Dockerfile`, `frontend/Dockerfile` | Phase 17 | Buildable images | Docker verification (Section 44) |
| 19. Supabase + Render + Vercel Deployment | Ship to production | Follow Section 50 sequence | Phase 18 | Live app | Production smoke test |
| 20. Production Verification | Final acceptance | Run Section 56 checklist against prod | Phase 19 | Signed-off MVP | All acceptance criteria pass |

---

## 56. Acceptance Criteria

Carried and preserved from the PRD:

**Add Expense:** valid amount entered; existing category selected; valid date selected; optional note entered; expense stored; appears in history; dashboard totals update.

**Dynamic Category:** category created; stored successfully; appears automatically in expense form; no source-code change required.

**Delete Expense:** delete selected; confirmation displayed; expense removed; history updates; dashboard totals update.

**Edit Expense:** one or more fields updated; validation re-applied; updated data saved; history and dashboard reflect the change.

**Delete Category:** delete selected on a category; confirmation displayed; if linked expenses exist, appropriate handling triggered (block or reassign, per Section 60); category list updates.

**Filtering:** category, date, or date-range filter applied; expense history updates to match; filters can be combined.

---

## 57. Requirements Traceability Matrix

| PRD Requirement | SRS Requirement | Implementation | API/UI/DB | Test Case |
|---|---|---|---|---|
| FR-1 | Section 21.2 (POST expenses) | Expense service `create_expense` | API + Add Expense UI + `expenses` table | `test_create_expense` |
| FR-2 | Section 21.2 (GET expenses) | Expense service `list_expenses` | API + Expense History UI | `test_list_expenses` |
| FR-3 | Section 21.2 (PUT expenses/{id}) | Expense service `update_expense` | API + Edit Expense UI | `test_update_expense` |
| FR-4 | Section 21.2 (DELETE expenses/{id}) | Expense service `delete_expense` | API + History UI delete action | `test_delete_expense` |
| FR-5 | Section 21.1 (POST categories) | Category service `create_category` | API + Category Management UI | `test_create_category` |
| FR-6 | Section 21.1 (GET categories) | Category service `list_categories` | API + Category Management UI | `test_list_categories` |
| FR-7 | Section 21.1 (PUT categories/{id}) | Category service `update_category` | API + Category Management UI | `test_update_category` |
| FR-8 | Section 21.1 (DELETE categories/{id}) | Category service `delete_category` | API + Category Management UI | `test_delete_category`, `test_delete_category_blocked` |
| FR-9 | Section 9, 12 (dynamic dropdown) | Add/Edit Expense form fetches `/api/categories` | UI | `test_category_appears_in_dropdown` (frontend) |
| FR-10 | Section 21.3 (dashboard) | Dashboard service aggregation queries | API + Dashboard UI | `test_dashboard_summary` |
| FR-11 | Section 21.2 (`category_id` filter) | Filter query param handling | API + History UI filter | `test_filter_by_category` |
| FR-12 | Section 21.2 (`date` filter) | Filter query param handling | API + History UI filter | `test_filter_by_date` |
| FR-13 | Section 21.2 (`date_from`/`date_to`) | Filter query param handling | API + History UI filter | `test_filter_by_date_range` |
| FR-14 | Section 21.3, 15 | Live SQL aggregation on every dashboard fetch | API + DB | `test_totals_recalculate_after_mutation` |
| Dynamic data requirement (PRD §8) | Sections 5.1, 19, 21 | No hardcoded categories/totals anywhere in source | DB + API + UI | `test_no_hardcoded_categories` (grep/lint check + functional test) |
| Validation (PRD §15) | Section 24 | Pydantic schemas + frontend validation utils | API + UI | `test_validation_rules` |
| Error handling (PRD §16) | Section 25 | Exception handlers | API | `test_error_responses` |
| User flows (PRD §10) | Section 8 | UI page/route implementation | UI | E2E suite (Section 39.3) |
| Acceptance criteria (PRD §18) | Section 56 | All of the above combined | Full stack | E2E suite (Section 39.3) |

---

## 58. Out of Scope

Preserved from the PRD — not implemented in this MVP:
- Login / Register
- Authentication
- AI features
- Payment gateway
- Notifications
- Real-time features
- Complex analytics
- Advanced budgeting
- Multi-user functionality
- Microservices
- Unnecessary third-party integrations

---

## 59. Future Extensibility

The layered architecture (Sections 11–14, 20) supports later addition of the following without a core rebuild:
- **Authentication:** add a users table, auth middleware, and protect existing routers — the existing Category/Expense schema can gain a `user_id` FK.
- **Multiple users:** extend `category_id`/`expense_date` filtering with `user_id` scoping at the service layer.
- **Income tracking / balance tracking:** new `income` table, mirrored CRUD + dashboard aggregation pattern.
- **Budgets / savings goals:** new tables referencing categories, compared against existing expense aggregates.
- **Advanced charts / reports:** additional dashboard/report endpoints built on the same aggregation service layer.
- **PDF/Excel export:** new export endpoints serializing existing query results.
- **Recurring expenses:** a `recurrence_rule` field or related table driving scheduled expense creation.
- **AI insights:** a new service consuming existing expense data, exposed via an additional endpoint.
- **Notifications:** an event/notification service layered on top of existing create/update/delete operations.
- **Mobile application:** the existing REST API is directly reusable by a future mobile client with no backend changes required.

None of these are implemented in the MVP; they are documented here only to confirm the architecture does not block them.

---

## 60. Open Decisions / TBD

The PRD explicitly leaves the following undecided. They are **not** silently resolved by this SRS as product decisions — flagged here per PRD Section 13 and this prompt's Section 45 requirement.

1. **Category deletion behavior when linked expenses exist.**
   PRD status: *"Deleting a Category that still has linked Expenses must be handled explicitly (e.g. block deletion, or require reassignment) — exact behavior to be confirmed during design."*
   **Interim Technical Decision (for implementation to proceed):** block deletion and return `409 Conflict` with the linked expense count (as specified in Section 21.1), until a product decision is made to instead support reassignment. This default was chosen because it is the simpler, safer behavior and can be replaced with a reassignment flow later without a schema change (Section 59 already treats this as extensible).
2. **Note field maximum character length.**
   PRD status: "reasonable character limit," no number given.
   **Interim Technical Decision:** 500 characters (Section 15.4). Purely a technical default, not a product requirement.
3. **"Recent expenses" count on the Dashboard.**
   PRD does not specify how many recent expenses to show.
   **Interim Technical Decision:** 5 most recent expenses (Section 21.3).
4. **Primary key type (integer vs UUID).**
   Not specified by the PRD.
   **Interim Technical Decision:** integer/serial, for MVP simplicity (Section 15.1–15.2).
5. **Category name uniqueness — case sensitivity.**
   PRD requires uniqueness but does not specify case sensitivity.
   **Interim Technical Decision:** case-insensitive uniqueness check (Section 21.1), so "Food" and "food" are treated as a duplicate.

Any of these may be revisited as explicit product decisions without requiring a rebuild of the core architecture.

---

## 61. Final Implementation Checklist

- [ ] Repository initialized with `frontend/`, `backend/`, and three `.gitignore` files (Sections 36–38)
- [ ] PostgreSQL + SQLAlchemy + Alembic configured; initial migration created and applied
- [ ] `categories` and `expenses` tables match Section 15 exactly, including constraints and indexes
- [ ] Seed script implemented and idempotent (Section 19)
- [ ] All Category and Expense CRUD endpoints implemented per Section 21, with correct status codes
- [ ] Filtering (category, date, date range, combined) implemented on `GET /api/expenses`
- [ ] Dashboard endpoint returns live-computed totals, count, recent expenses, category summary
- [ ] `GET /health` implemented with DB connectivity check
- [ ] `GET /api/contact` implemented, configuration-driven
- [ ] Backend (Pydantic) validation implemented and authoritative for all fields in Section 24
- [ ] Consistent error handling implemented per Section 25, no sensitive data ever leaked
- [ ] Next.js frontend implements all five pages (Section 9) with categories fetched dynamically — no hardcoded category list anywhere in frontend source
- [ ] Frontend validation mirrors backend rules (UX only, not authoritative)
- [ ] Responsive design verified across mobile/tablet/laptop/desktop/large desktop (Section 27)
- [ ] Framer Motion animations implemented per Section 28, respecting reduced-motion preference
- [ ] Micro-interactions implemented per Section 29
- [ ] Optional lightweight 3D element (if included) verified non-blocking with mobile fallback (Section 30)
- [ ] Backend Pytest suite covers CRUD, filtering, dashboard, validation, error handling (Section 39.1)
- [ ] Frontend tests cover components, forms, validation, API integration, loading/error states (Section 39.2)
- [ ] Full E2E functional test list passes (Section 39.3)
- [ ] Local development works end-to-end without Docker (Section 40)
- [ ] `backend/Dockerfile` and `frontend/Dockerfile` build successfully; Docker verification checklist passes (Sections 42–44)
- [ ] Supabase production database configured, migrated, and seeded (Section 45)
- [ ] Backend deployed to Render; `/health` verified live (Section 46)
- [ ] Frontend deployed to Vercel; verified against live Render backend (Section 47)
- [ ] Production CORS restricted to the live Vercel origin only (Section 48)
- [ ] Full production path (`Vercel → Render → Supabase`) verified (Sections 49–50)
- [ ] All PRD acceptance criteria verified in production (Section 56)
- [ ] Requirements Traceability Matrix fully populated with no unmapped PRD requirement (Section 57)
- [ ] No business data (categories, expenses, totals, counts, summaries, dropdown options) hardcoded anywhere in source code
- [ ] All Open Decisions (Section 60) documented and their interim defaults implemented consistently

---

*Document Version: 1.0*
*Status: Draft — Implementation-Ready*
*Derived from: Personal Expense Tracker PRD v1.0*
