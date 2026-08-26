import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.routes import health, contact, categories, expenses, dashboard

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kharchyapani")

app = FastAPI(
    title="KharchyaPani API",
    description="Personal Expense Tracker Backend API",
    version="1.0.0"
)

# CORS configuration
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    origins = [origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router)
app.include_router(contact.router)
app.include_router(categories.router)
app.include_router(expenses.router)
app.include_router(dashboard.router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error for request {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

@app.get("/")
def root():
    return {"message": "Welcome to KharchyaPani API. Visit /health for status or /docs for API documentation."}
