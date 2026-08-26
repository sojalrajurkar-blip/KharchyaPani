# KharchyaPani — Personal Expense Tracker

A simple, dynamic, database-driven personal expense tracker built with Next.js (App Router), TypeScript, Framer Motion, Python FastAPI, Pydantic, SQLAlchemy, Alembic, and PostgreSQL.

## Architecture

- **Frontend**: Next.js (App Router) + TypeScript + Framer Motion
- **Backend**: Python FastAPI + Pydantic + SQLAlchemy + Alembic
- **Database**: PostgreSQL (`kharchyapani_db`)

## Local Development Setup

### 1. Prerequisites
- Python 3.8+
- Node.js 18+
- PostgreSQL server running on `localhost:5432`

### 2. Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   py -3.8 -m venv .venv
   .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env`:
   ```bash
   cp .env.example .env
   ```
   Set `DATABASE_URL=postgresql://postgres:password@localhost:5432/kharchyapani_db`
5. Run database migrations:
   ```bash
   alembic upgrade head
   ```
6. Run database seed (optional initial categories):
   ```bash
   python -m app.db.seed
   ```
7. Start FastAPI dev server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 3. Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
4. Start Next.js dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.
