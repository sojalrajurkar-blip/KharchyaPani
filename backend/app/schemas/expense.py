from pydantic import BaseModel, Field, ConfigDict, field_validator
from decimal import Decimal
from datetime import date, datetime
from typing import Optional

class ExpenseCreate(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Expense amount must be > 0 with up to 2 decimal places")
    category_id: int = Field(..., description="Category ID reference")
    expense_date: date = Field(..., description="Expense date")
    note: Optional[str] = Field(None, max_length=500, description="Optional note, max 500 chars")

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be greater than zero.")
        return round(v, 2)

    @field_validator("note")
    @classmethod
    def validate_note(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 500:
                raise ValueError("Note cannot exceed 500 characters.")
            return v if v else None
        return None

class ExpenseUpdate(ExpenseCreate):
    pass

class ExpenseResponse(BaseModel):
    id: int
    amount: Decimal
    category_id: int
    category_name: Optional[str] = None
    expense_date: date
    note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
