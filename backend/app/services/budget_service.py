from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import List, Optional
from decimal import Decimal
from datetime import date
import calendar
from app.models.budget import Budget
from app.models.category import Category
from app.models.expense import Expense
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetProgress

def _format_budget_response(budget: Budget) -> BudgetResponse:
    category_name = budget.category.name if budget.category else None
    return BudgetResponse(
        id=budget.id,
        period_type=budget.period_type,
        category_id=budget.category_id,
        category_name=category_name,
        amount_limit=budget.amount_limit,
        created_at=budget.created_at,
        updated_at=budget.updated_at
    )

def get_budgets(db: Session) -> List[BudgetResponse]:
    budgets = db.query(Budget).outerjoin(Category).all()
    return [_format_budget_response(b) for b in budgets]

def create_or_update_budget(db: Session, budget_in: BudgetCreate) -> BudgetResponse:
    if budget_in.category_id is not None:
        cat = db.query(Category).filter(Category.id == budget_in.category_id).first()
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found."
            )

    existing = db.query(Budget).filter(
        Budget.period_type == budget_in.period_type,
        Budget.category_id == budget_in.category_id
    ).first()

    if existing:
        existing.amount_limit = budget_in.amount_limit
        db.commit()
        db.refresh(existing)
        return _format_budget_response(existing)
    
    budget = Budget(
        period_type=budget_in.period_type,
        category_id=budget_in.category_id,
        amount_limit=budget_in.amount_limit
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return _format_budget_response(budget)

def update_budget(db: Session, budget_id: int, budget_in: BudgetUpdate) -> BudgetResponse:
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget setting not found."
        )
    budget.amount_limit = budget_in.amount_limit
    db.commit()
    db.refresh(budget)
    return _format_budget_response(budget)

def delete_budget(db: Session, budget_id: int) -> None:
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget setting not found."
        )
    db.delete(budget)
    db.commit()

def get_budget_statuses(db: Session) -> List[BudgetProgress]:
    budgets = db.query(Budget).outerjoin(Category).all()
    results = []

    today = date.today()
    first_of_month = today.replace(day=1)
    _, last_day = calendar.monthrange(today.year, today.month)
    end_of_month = today.replace(day=last_day)

    for b in budgets:
        query = db.query(func.coalesce(func.sum(Expense.amount), Decimal("0.00")))
        if b.category_id is not None:
            query = query.filter(Expense.category_id == b.category_id)

        if b.period_type == "daily":
            query = query.filter(Expense.expense_date == today)
        else:
            query = query.filter(
                Expense.expense_date >= first_of_month,
                Expense.expense_date <= end_of_month
            )

        spent = query.scalar() or Decimal("0.00")
        remaining = b.amount_limit - spent
        percentage = float((spent / b.amount_limit) * 100) if b.amount_limit > 0 else 0.0

        results.append(BudgetProgress(
            id=b.id,
            period_type=b.period_type,
            category_id=b.category_id,
            category_name=b.category.name if b.category else ("Overall Daily" if b.period_type == "daily" else "Overall Monthly"),
            amount_limit=b.amount_limit,
            spent_amount=spent,
            remaining_amount=remaining,
            percentage=round(percentage, 1)
        ))

    return results

def get_daily_budget_progress(db: Session) -> Optional[BudgetProgress]:
    daily_budget = db.query(Budget).filter(
        Budget.period_type == "daily",
        Budget.category_id.is_(None)
    ).first()

    if not daily_budget:
        return None

    today = date.today()
    spent = db.query(func.coalesce(func.sum(Expense.amount), Decimal("0.00"))).filter(
        Expense.expense_date == today
    ).scalar() or Decimal("0.00")

    remaining = daily_budget.amount_limit - spent
    pct = float((spent / daily_budget.amount_limit) * 100) if daily_budget.amount_limit > 0 else 0.0

    return BudgetProgress(
        id=daily_budget.id,
        period_type="daily",
        category_id=None,
        category_name="Overall Daily",
        amount_limit=daily_budget.amount_limit,
        spent_amount=spent,
        remaining_amount=remaining,
        percentage=round(pct, 1)
    )
