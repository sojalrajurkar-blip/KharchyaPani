from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import date
from app.models.expense import Expense
from app.models.category import Category
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse

def _format_expense_response(expense: Expense) -> ExpenseResponse:
    category_name = expense.category.name if expense.category else None
    return ExpenseResponse(
        id=expense.id,
        amount=expense.amount,
        category_id=expense.category_id,
        category_name=category_name,
        expense_date=expense.expense_date,
        payment_mode=expense.payment_mode or "Cash",
        note=expense.note,
        created_at=expense.created_at,
        updated_at=expense.updated_at
    )

def get_expenses(
    db: Session,
    category_id: Optional[int] = None,
    expense_date: Optional[date] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    payment_mode: Optional[str] = None
) -> List[ExpenseResponse]:
    query = db.query(Expense).join(Category)
    
    if category_id is not None:
        query = query.filter(Expense.category_id == category_id)
    if expense_date is not None:
        query = query.filter(Expense.expense_date == expense_date)
    if date_from is not None:
        query = query.filter(Expense.expense_date >= date_from)
    if date_to is not None:
        query = query.filter(Expense.expense_date <= date_to)
    if payment_mode:
        query = query.filter(Expense.payment_mode == payment_mode)

    expenses = query.order_by(Expense.expense_date.desc(), Expense.id.desc()).all()
    return [_format_expense_response(e) for e in expenses]

def get_expense_by_id(db: Session, expense_id: int) -> ExpenseResponse:
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found."
        )
    return _format_expense_response(expense)

def create_expense(db: Session, expense_in: ExpenseCreate) -> ExpenseResponse:
    category = db.query(Category).filter(Category.id == expense_in.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found."
        )
    
    expense = Expense(
        amount=expense_in.amount,
        category_id=expense_in.category_id,
        expense_date=expense_in.expense_date,
        payment_mode=expense_in.payment_mode,
        note=expense_in.note
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return _format_expense_response(expense)

def update_expense(db: Session, expense_id: int, expense_in: ExpenseUpdate) -> ExpenseResponse:
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found."
        )
    
    category = db.query(Category).filter(Category.id == expense_in.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found."
        )

    expense.amount = expense_in.amount
    expense.category_id = expense_in.category_id
    expense.expense_date = expense_in.expense_date
    expense.payment_mode = expense_in.payment_mode
    expense.note = expense_in.note
    db.commit()
    db.refresh(expense)
    return _format_expense_response(expense)

def delete_expense(db: Session, expense_id: int) -> None:
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found."
        )
    db.delete(expense)
    db.commit()
