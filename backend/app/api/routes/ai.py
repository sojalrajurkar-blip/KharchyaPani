import calendar
from datetime import date
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.expense import Expense
from app.models.budget import Budget
from app.services.category_service import get_categories
from app.services.ai.factory import get_ai_provider
from app.schemas.ai import (
    ReceiptScanResponse,
    ExpenseParseRequest,
    ExpenseParseResponse,
    AIChatRequest,
    AIChatResponse,
    AIInsightsResponse,
)

router = APIRouter(prefix="/api/ai", tags=["AI"])

MAX_RECEIPT_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/jpg"}

def _build_user_ai_context(db: Session, user_id: int) -> Dict[str, Any]:
    today = date.today()
    _, last_day = calendar.monthrange(today.year, today.month)
    month_start = date(today.year, today.month, 1)
    month_end = date(today.year, today.month, last_day)

    # Monthly total spend
    monthly_result = db.query(
        func.coalesce(func.sum(Expense.amount), Decimal("0.00"))
    ).filter(
        Expense.user_id == user_id,
        Expense.expense_date >= month_start,
        Expense.expense_date <= month_end,
    ).first()
    monthly_total = float(monthly_result[0]) if monthly_result else 0.0

    # Monthly active budget limit
    monthly_budget_obj = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.period_type == "monthly",
        Budget.category_id.is_(None),
    ).first()
    monthly_budget = float(monthly_budget_obj.amount_limit) if monthly_budget_obj else 0.0

    # Category totals this month
    cat_rows = db.query(
        Expense.category_id,
        func.sum(Expense.amount).label("total")
    ).filter(
        Expense.user_id == user_id,
        Expense.expense_date >= month_start,
        Expense.expense_date <= month_end,
    ).group_by(Expense.category_id).all()

    user_cats = get_categories(db, user_id)
    cat_name_map = {c.id: c.name for c in user_cats}
    category_totals = {cat_name_map.get(cid, "Other"): float(tot) for cid, tot in cat_rows}

    top_category = "None"
    if category_totals:
        top_category = max(category_totals, key=category_totals.get)

    return {
        "monthly_total": monthly_total,
        "monthly_budget": monthly_budget,
        "day_of_month": today.day,
        "days_in_month": last_day,
        "top_category": top_category,
        "category_totals": category_totals,
    }

@router.post("/scan-receipt", response_model=ReceiptScanResponse, status_code=status.HTTP_200_OK)
async def scan_receipt(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Scan and extract structured transaction details from receipt/invoice photo."""
    content_type = file.content_type or "image/jpeg"
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image format. Allowed formats: JPEG, PNG, WebP.",
        )

    image_bytes = await file.read()
    if len(image_bytes) > MAX_RECEIPT_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Receipt image exceeds 5MB size limit.",
        )

    categories = [{"id": c.id, "name": c.name} for c in get_categories(db, current_user.id)]
    provider = get_ai_provider()

    try:
        return await provider.scan_receipt(image_bytes, content_type, categories)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI receipt scan temporarily unavailable: {str(e)}",
        )

@router.post("/parse-expense", response_model=ExpenseParseResponse, status_code=status.HTTP_200_OK)
async def parse_expense(
    request: ExpenseParseRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Parse natural language phrase in Marathi, Hindi, or English into structured expense."""
    categories = [{"id": c.id, "name": c.name} for c in get_categories(db, current_user.id)]
    provider = get_ai_provider()

    try:
        return await provider.parse_expense_text(request.text, categories, date.today())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI expense parsing temporarily unavailable: {str(e)}",
        )

@router.post("/chat", response_model=AIChatResponse, status_code=status.HTTP_200_OK)
async def ai_chat(
    request: AIChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """KharchaMitra AI financial co-pilot answering conversational queries over private spending data."""
    context = _build_user_ai_context(db, current_user.id)
    provider = get_ai_provider()

    try:
        return await provider.chat(request.message, request.history, context)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"KharchaMitra is temporarily unavailable: {str(e)}",
        )

@router.get("/insights", response_model=AIInsightsResponse, status_code=status.HTTP_200_OK)
async def ai_insights(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Calculate spending velocity warnings and practical savings recommendations."""
    context = _build_user_ai_context(db, current_user.id)
    provider = get_ai_provider()

    try:
        return await provider.generate_insights(context)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI insights temporarily unavailable: {str(e)}",
        )
