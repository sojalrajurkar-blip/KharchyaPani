from pydantic import BaseModel, Field, ConfigDict, field_validator
from decimal import Decimal
from datetime import datetime
from typing import Optional, List

class BudgetCreate(BaseModel):
    period_type: str = Field("monthly", description="Budget period: 'daily' or 'monthly'")
    category_id: Optional[int] = Field(None, description="Category ID for category budget, or None for overall budget")
    amount_limit: Decimal = Field(..., gt=0, decimal_places=2, description="Budget limit must be > 0")

    @field_validator("period_type")
    @classmethod
    def validate_period_type(cls, v: str) -> str:
        v = v.lower().strip()
        if v not in ("daily", "monthly"):
            raise ValueError("Period type must be either 'daily' or 'monthly'.")
        return v

    @field_validator("amount_limit")
    @classmethod
    def validate_amount_limit(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount limit must be greater than zero.")
        return round(v, 2)

class BudgetUpdate(BaseModel):
    amount_limit: Decimal = Field(..., gt=0, decimal_places=2, description="Budget limit must be > 0")

    @field_validator("amount_limit")
    @classmethod
    def validate_amount_limit(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount limit must be greater than zero.")
        return round(v, 2)

class BudgetResponse(BaseModel):
    id: int
    period_type: str
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    amount_limit: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BudgetProgress(BaseModel):
    id: Optional[int] = None
    period_type: str
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    amount_limit: Decimal
    spent_amount: Decimal
    remaining_amount: Decimal
    percentage: float
