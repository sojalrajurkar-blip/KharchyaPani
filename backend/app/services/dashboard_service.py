from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from app.models.expense import Expense
from app.models.category import Category
from app.schemas.dashboard import DashboardSummaryResponse, CategorySummaryItem, PaymentModeSummaryItem
from app.services.expense_service import _format_expense_response
from app.services.budget_service import get_daily_budget_progress

def get_dashboard_summary(db: Session) -> DashboardSummaryResponse:
    # SQL Aggregation for total expense and count
    total_result = db.query(
        func.coalesce(func.sum(Expense.amount), Decimal("0.00")),
        func.count(Expense.id)
    ).first()
    
    total_expense = total_result[0] if total_result else Decimal("0.00")
    expense_count = total_result[1] if total_result else 0

    # 5 most recent expenses
    recent_db_expenses = db.query(Expense).join(Category)\
        .order_by(Expense.expense_date.desc(), Expense.id.desc())\
        .limit(5)\
        .all()
    recent_expenses = [_format_expense_response(e) for e in recent_db_expenses]

    # Category summary SQL aggregation
    category_summary_rows = db.query(
        Category.id.label("category_id"),
        Category.name.label("category_name"),
        func.coalesce(func.sum(Expense.amount), Decimal("0.00")).label("total"),
        func.count(Expense.id).label("count")
    ).join(Expense, Category.id == Expense.category_id)\
     .group_by(Category.id, Category.name)\
     .order_by(func.sum(Expense.amount).desc())\
     .all()

    category_summary = [
        CategorySummaryItem(
            category_id=row.category_id,
            category_name=row.category_name,
            total=row.total,
            count=row.count
        )
        for row in category_summary_rows
    ]

    # Payment Mode summary SQL aggregation
    payment_mode_rows = db.query(
        Expense.payment_mode,
        func.coalesce(func.sum(Expense.amount), Decimal("0.00")).label("total"),
        func.count(Expense.id).label("count")
    ).group_by(Expense.payment_mode)\
     .order_by(func.sum(Expense.amount).desc())\
     .all()

    payment_mode_summary = [
        PaymentModeSummaryItem(
            payment_mode=row.payment_mode,
            total=row.total,
            count=row.count
        )
        for row in payment_mode_rows
    ]

    daily_budget_progress = get_daily_budget_progress(db)

    return DashboardSummaryResponse(
        total_expense=total_expense,
        expense_count=expense_count,
        recent_expenses=recent_expenses,
        category_summary=category_summary,
        payment_mode_summary=payment_mode_summary,
        daily_budget_progress=daily_budget_progress
    )
