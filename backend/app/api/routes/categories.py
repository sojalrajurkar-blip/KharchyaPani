from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.services import category_service

router = APIRouter(prefix="/api/categories", tags=["Categories"])

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category_in: CategoryCreate, db: Session = Depends(get_db)):
    return category_service.create_category(db, category_in)

@router.get("", response_model=List[CategoryResponse], status_code=status.HTTP_200_OK)
def list_categories(db: Session = Depends(get_db)):
    return category_service.get_categories(db)

@router.get("/{category_id}", response_model=CategoryResponse, status_code=status.HTTP_200_OK)
def get_category(category_id: int, db: Session = Depends(get_db)):
    return category_service.get_category_by_id(db, category_id)

@router.put("/{category_id}", response_model=CategoryResponse, status_code=status.HTTP_200_OK)
def update_category(category_id: int, category_in: CategoryUpdate, db: Session = Depends(get_db)):
    return category_service.update_category(db, category_id, category_in)

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category_service.delete_category(db, category_id)
    return None
