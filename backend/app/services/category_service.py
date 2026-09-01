from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import List
from app.models.category import Category
from app.models.expense import Expense
from app.schemas.category import CategoryCreate, CategoryUpdate

def get_categories(db: Session, user_id: int) -> List[Category]:
    return db.query(Category).filter(Category.user_id == user_id).order_by(Category.name.asc()).all()

def get_category_by_id(db: Session, category_id: int, user_id: int) -> Category:
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == user_id
    ).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found."
        )
    return category

def create_category(db: Session, category_in: CategoryCreate, user_id: int) -> Category:
    # Case-insensitive uniqueness check per user
    existing = db.query(Category).filter(
        Category.user_id == user_id,
        func.lower(Category.name) == category_in.name.strip().lower()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A category named '{category_in.name.strip()}' already exists."
        )
    category = Category(user_id=user_id, name=category_in.name.strip())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

def update_category(db: Session, category_id: int, category_in: CategoryUpdate, user_id: int) -> Category:
    category = get_category_by_id(db, category_id, user_id)
    # Check duplicate name among user's other categories
    existing = db.query(Category).filter(
        Category.user_id == user_id,
        func.lower(Category.name) == category_in.name.strip().lower(),
        Category.id != category_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A category named '{category_in.name.strip()}' already exists."
        )
    category.name = category_in.name.strip()
    db.commit()
    db.refresh(category)
    return category

def delete_category(db: Session, category_id: int, user_id: int) -> None:
    category = get_category_by_id(db, category_id, user_id)
    linked_count = db.query(Expense).filter(
        Expense.user_id == user_id,
        Expense.category_id == category_id
    ).count()
    if linked_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete category '{category.name}' because it has {linked_count} linked expense(s)."
        )
    db.delete(category)
    db.commit()
