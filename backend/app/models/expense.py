from sqlalchemy import Column, Integer, Numeric, Date, String, DateTime, ForeignKey, CheckConstraint, func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    expense_date = Column(Date, nullable=False, index=True)
    payment_mode = Column(String(50), nullable=False, server_default="Cash", index=True)
    note = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    category = relationship("Category", back_populates="expenses")

    __table_args__ = (
        CheckConstraint('amount > 0', name='check_amount_positive'),
    )
