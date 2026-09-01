from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetProgress
from app.services import budget_service

router = APIRouter(prefix="/api/budgets", tags=["Budgets"])

@router.get("", response_model=List[BudgetResponse], status_code=status.HTTP_200_OK)
def list_budgets(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return budget_service.get_budgets(db, current_user.id)

@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def set_budget(
    budget_in: BudgetCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return budget_service.create_or_update_budget(db, budget_in, current_user.id)

@router.put("/{budget_id}", response_model=BudgetResponse, status_code=status.HTTP_200_OK)
def update_budget(
    budget_id: int,
    budget_in: BudgetUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return budget_service.update_budget(db, budget_id, budget_in, current_user.id)

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    budget_service.delete_budget(db, budget_id, current_user.id)
    return None

@router.get("/status", response_model=List[BudgetProgress], status_code=status.HTTP_200_OK)
def get_budget_statuses(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return budget_service.get_budget_statuses(db, current_user.id)
