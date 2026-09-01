from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.services import expense_service

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])

@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_in: ExpenseCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return expense_service.create_expense(db, expense_in, current_user.id)

@router.get("", response_model=List[ExpenseResponse], status_code=status.HTTP_200_OK)
def list_expenses(
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    date: Optional[date] = Query(None, description="Filter by exact date"),
    date_from: Optional[date] = Query(None, description="Filter by start date (inclusive)"),
    date_to: Optional[date] = Query(None, description="Filter by end date (inclusive)"),
    payment_mode: Optional[str] = Query(None, description="Filter by payment mode e.g. Cash, UPI"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return expense_service.get_expenses(
        db,
        user_id=current_user.id,
        category_id=category_id,
        expense_date=date,
        date_from=date_from,
        date_to=date_to,
        payment_mode=payment_mode
    )

@router.get("/{expense_id}", response_model=ExpenseResponse, status_code=status.HTTP_200_OK)
def get_expense(
    expense_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return expense_service.get_expense_by_id(db, expense_id, current_user.id)

@router.put("/{expense_id}", response_model=ExpenseResponse, status_code=status.HTTP_200_OK)
def update_expense(
    expense_id: int,
    expense_in: ExpenseUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return expense_service.update_expense(db, expense_id, expense_in, current_user.id)

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    expense_service.delete_expense(db, expense_id, current_user.id)
    return None
