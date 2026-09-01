from sqlalchemy import Column, Integer, Numeric, String, DateTime, ForeignKey, UniqueConstraint, CheckConstraint, func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    period_type = Column(String(20), nullable=False, default="monthly", index=True) # 'daily' or 'monthly'
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=True, index=True)
    amount_limit = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    user = relationship("User", back_populates="budgets")
    category = relationship("Category")

    __table_args__ = (
        UniqueConstraint('user_id', 'period_type', 'category_id', name='uq_user_period_category'),
        CheckConstraint('amount_limit > 0', name='check_budget_amount_limit_positive'),
        CheckConstraint("period_type IN ('daily', 'monthly')", name='check_budget_period_type_valid'),
    )
