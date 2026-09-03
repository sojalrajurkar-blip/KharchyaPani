import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from sqlalchemy import text
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
import app.models
from app.api.routes import health, contact, auth, categories, expenses, dashboard, budgets, ai

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kharchyapani")

# Ensure all database tables exist on startup and patch legacy constraints
try:
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        # If an old global unique constraint/index exists on categories(name), drop it
        # so categories are scoped per-user (uq_user_category_name)
        try:
            conn.execute(text("ALTER TABLE categories DROP CONSTRAINT IF EXISTS ix_categories_name;"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("DROP INDEX IF EXISTS ix_categories_name;"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_categories_name ON categories (name);"))
            conn.commit()
        except Exception:
            pass
except Exception as e:
    logger.error(f"Error creating/patching database tables: {e}")

app = FastAPI(
    title="KharchyaPani API",
    description="Personal Expense Tracker Backend API with Secure JWT Authentication & Multi-Tenancy",
    version="3.0.0"
)

# CORS configuration
raw_origins = settings.CORS_ORIGINS
if isinstance(raw_origins, str):
    origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
elif isinstance(raw_origins, list):
    origins = raw_origins
else:
    origins = []

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router)
app.include_router(contact.router)
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(expenses.router)
app.include_router(dashboard.router)
app.include_router(budgets.router)
app.include_router(ai.router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error for request {request.url.path}: {exc}", exc_info=True)
    origin = request.headers.get("origin")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal Server Error: {str(exc)}"},
        headers=headers
    )

@app.get("/")
def root():
    return {"message": "Welcome to KharchyaPani API. Visit /health for status or /docs for API documentation."}
