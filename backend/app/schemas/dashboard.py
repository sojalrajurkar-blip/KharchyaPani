from pydantic import BaseModel
from decimal import Decimal
from typing import List, Optional
from app.schemas.expense import ExpenseResponse
from app.schemas.budget import BudgetProgress

class CategorySummaryItem(BaseModel):
    category_id: int
    category_name: str
    total: Decimal
    count: int

class PaymentModeSummaryItem(BaseModel):
    payment_mode: str
    total: Decimal
    count: int

class DashboardSummaryResponse(BaseModel):
    total_expense: Decimal
    expense_count: int
    recent_expenses: List[ExpenseResponse]
    category_summary: List[CategorySummaryItem]
    payment_mode_summary: List[PaymentModeSummaryItem]
    daily_budget_progress: Optional[BudgetProgress] = None
