from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetProgress
from app.services import budget_service

router = APIRouter(prefix="/api/budgets", tags=["Budgets"])

@router.get("", response_model=List[BudgetResponse], status_code=status.HTTP_200_OK)
def list_budgets(db: Session = Depends(get_db)):
    return budget_service.get_budgets(db)

@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def set_budget(budget_in: BudgetCreate, db: Session = Depends(get_db)):
    return budget_service.create_or_update_budget(db, budget_in)

@router.put("/{budget_id}", response_model=BudgetResponse, status_code=status.HTTP_200_OK)
def update_budget(budget_id: int, budget_in: BudgetUpdate, db: Session = Depends(get_db)):
    return budget_service.update_budget(db, budget_id, budget_in)

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    budget_service.delete_budget(db, budget_id)
    return None

@router.get("/status", response_model=List[BudgetProgress], status_code=status.HTTP_200_OK)
def get_budget_statuses(db: Session = Depends(get_db)):
    return budget_service.get_budget_statuses(db)
