from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date

class ReceiptScanResponse(BaseModel):
    amount: Optional[float] = Field(None, description="Total amount extracted from receipt")
    expense_date: Optional[date] = Field(None, description="Date of transaction extracted from receipt")
    merchant_name: Optional[str] = Field(None, description="Store or vendor name")
    suggested_category_name: Optional[str] = Field(None, description="Predicted expense category")
    suggested_category_id: Optional[int] = Field(None, description="Matched user category ID if available")
    payment_mode: Optional[str] = Field("UPI", description="Detected payment method")
    note: Optional[str] = Field(None, description="Summary or line items from receipt")
    confidence: float = Field(0.9, description="Confidence score between 0.0 and 1.0")
    raw_text: Optional[str] = Field(None, description="Extracted OCR text or summary")

class ExpenseParseRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500, description="Natural language expense description in Marathi, Hindi, or English")

class ExpenseParseResponse(BaseModel):
    amount: float = Field(..., description="Extracted numerical expense amount")
    expense_date: date = Field(..., description="Calculated ISO date for the expense")
    suggested_category_name: Optional[str] = Field(None, description="Matched category name")
    suggested_category_id: Optional[int] = Field(None, description="Matched category ID if resolved")
    payment_mode: str = Field("UPI", description="Extracted payment mode (Cash, UPI, Card, Net Banking)")
    note: Optional[str] = Field(None, description="Cleaned description or note")
    confidence: float = Field(0.95, description="Parsing confidence score")

class AIChatMessage(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message text")

class SuggestedAction(BaseModel):
    label: str = Field(..., description="Button label for action")
    href: str = Field(..., description="Destination internal path")

class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="User question or statement")
    history: List[AIChatMessage] = Field(default_factory=list, description="Recent conversation turns")

class AIChatResponse(BaseModel):
    reply: str = Field(..., description="KharchaMitra AI co-pilot reply")
    suggested_actions: List[SuggestedAction] = Field(default_factory=list, description="Follow-up quick navigation links")

class VelocityWarning(BaseModel):
    has_warning: bool = Field(False, description="Whether an active budget is projected to run out early")
    category_name: Optional[str] = Field(None, description="Affected category name")
    predicted_exhaustion_date: Optional[str] = Field(None, description="Estimated date budget will hit 100%")
    message: str = Field("", description="User-friendly alert message in Marathi/English")

class AIInsightsResponse(BaseModel):
    velocity_warning: VelocityWarning
    savings_tips: List[str] = Field(default_factory=list, description="Actionable recommendations to save money")
