from abc import ABC, abstractmethod
from typing import List, Dict, Any
from datetime import date
from app.schemas.ai import (
    ReceiptScanResponse,
    ExpenseParseResponse,
    AIChatMessage,
    AIChatResponse,
    AIInsightsResponse,
)

class BaseAIProvider(ABC):
    """Abstract Base Class for swappable AI providers."""

    @abstractmethod
    async def scan_receipt(
        self,
        image_bytes: bytes,
        mime_type: str,
        user_categories: List[Dict[str, Any]],
    ) -> ReceiptScanResponse:
        """Extract transaction details from receipt image."""
        pass

    @abstractmethod
    async def parse_expense_text(
        self,
        text: str,
        user_categories: List[Dict[str, Any]],
        current_date: date,
    ) -> ExpenseParseResponse:
        """Parse natural language phrase (Marathi, Hindi, English) into structured expense."""
        pass

    @abstractmethod
    async def chat(
        self,
        message: str,
        history: List[AIChatMessage],
        context: Dict[str, Any],
    ) -> AIChatResponse:
        """Process conversational Q&A for KharchaMitra financial co-pilot."""
        pass

    @abstractmethod
    async def generate_insights(
        self,
        context: Dict[str, Any],
    ) -> AIInsightsResponse:
        """Generate spending velocity warnings and practical savings recommendations."""
        pass
