import json
import base64
import logging
from typing import List, Dict, Any, Optional
from datetime import date
import httpx

from app.core.config import settings
from app.services.ai.base import BaseAIProvider
from app.services.ai.mock_provider import MockAIProvider
from app.schemas.ai import (
    ReceiptScanResponse,
    ExpenseParseResponse,
    AIChatMessage,
    AIChatResponse,
    SuggestedAction,
    VelocityWarning,
    AIInsightsResponse,
)

logger = logging.getLogger(__name__)

class GeminiProvider(BaseAIProvider):
    """Production Google Gemini 1.5/2.0 Flash AI Provider with resilient Mock fallback."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""
        self.model = settings.AI_MODEL.strip() if settings.AI_MODEL else "gemini-flash-latest"
        self.temperature = settings.AI_TEMPERATURE
        self.max_tokens = settings.AI_MAX_OUTPUT_TOKENS
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        self.fallback_provider = MockAIProvider()

    def _get_api_url(self) -> str:
        return f"{self.base_url}?key={self.api_key}"


    async def _call_gemini(self, contents: List[Dict[str, Any]], system_instruction: Optional[str] = None) -> str:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured in environment variables.")

        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": self.temperature,
                "maxOutputTokens": self.max_tokens,
                "responseMimeType": "application/json",
            }
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                self._get_api_url(),
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            if resp.status_code != 200:
                logger.error(f"Gemini API Error [{resp.status_code}]: {resp.text}")
                raise RuntimeError(f"Gemini API request failed with status {resp.status_code}: {resp.text}")

            data = resp.json()
            try:
                candidates = data.get("candidates", [])
                if not candidates:
                    raise RuntimeError("No candidate response received from Gemini API.")
                text = candidates[0]["content"]["parts"][0]["text"]
                return text
            except (KeyError, IndexError) as e:
                logger.error(f"Failed to parse Gemini response: {data}")
                raise RuntimeError(f"Malformed response structure from Gemini API: {str(e)}")

    async def scan_receipt(
        self,
        image_bytes: bytes,
        mime_type: str,
        user_categories: List[Dict[str, Any]],
    ) -> ReceiptScanResponse:
        try:
            b64_image = base64.b64encode(image_bytes).decode("utf-8")
            categories_list = [c.get("name") for c in user_categories if c.get("name")]
            categories_str = ", ".join(categories_list) if categories_list else "Food, Travel, Shopping, Bills, Health, Other"

            prompt = (
                "You are an expert financial receipt OCR parser. Analyze the provided receipt or invoice image.\n"
                f"Available user categories: [{categories_str}].\n"
                "Extract the following fields and return ONLY a valid JSON object:\n"
                "{\n"
                '  "amount": <number or null>,\n'
                '  "expense_date": "<YYYY-MM-DD or null>",\n'
                '  "merchant_name": "<Store/Vendor name or null>",\n'
                '  "suggested_category_name": "<Best matching category from the list above or general term>",\n'
                '  "payment_mode": "<Cash, UPI, Card, or Net Banking>",\n'
                '  "note": "<Brief summary of main items purchased>",\n'
                '  "confidence": <float between 0.0 and 1.0>\n'
                "}"
            )

            contents = [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": b64_image,
                            }
                        }
                    ]
                }
            ]

            raw_json = await self._call_gemini(contents)
            try:
                parsed = json.loads(raw_json)
            except json.JSONDecodeError:
                cleaned = raw_json.strip().lstrip("```json").rstrip("```").strip()
                parsed = json.loads(cleaned)

            suggested_name = parsed.get("suggested_category_name")
            cat_id = None
            if suggested_name:
                for c in user_categories:
                    if c.get("name", "").lower() == suggested_name.lower():
                        cat_id = c.get("id")
                        break

            expense_date_val = None
            if parsed.get("expense_date"):
                try:
                    expense_date_val = date.fromisoformat(parsed["expense_date"])
                except ValueError:
                    expense_date_val = date.today()

            return ReceiptScanResponse(
                amount=parsed.get("amount"),
                expense_date=expense_date_val or date.today(),
                merchant_name=parsed.get("merchant_name"),
                suggested_category_name=suggested_name or "Shopping",
                suggested_category_id=cat_id,
                payment_mode=parsed.get("payment_mode") or "UPI",
                note=parsed.get("note"),
                confidence=float(parsed.get("confidence", 0.9)),
                raw_text=raw_json[:200],
            )
        except Exception as e:
            logger.warning(f"Gemini scan_receipt failed ({e}), falling back to MockAIProvider.")
            return await self.fallback_provider.scan_receipt(image_bytes, mime_type, user_categories)

    async def parse_expense_text(
        self,
        text: str,
        user_categories: List[Dict[str, Any]],
        current_date: date,
    ) -> ExpenseParseResponse:
        try:
            categories_list = [c.get("name") for c in user_categories if c.get("name")]
            categories_str = ", ".join(categories_list) if categories_list else "Food, Travel, Shopping, Bills, Health, Other"

            prompt = (
                f"Current date is {current_date.isoformat()}.\n"
                f"Available categories: [{categories_str}].\n"
                f"User input text: '{text}'.\n"
                "The text can be in Marathi, Hindi, English, or Hinglish (e.g., 'काल मित्रांसोबत चहा नाश्ता केला ₹१२०' -> amount: 120, date: yesterday, category: Food, note: 'चहा नाश्ता').\n"
                "Extract and return ONLY a valid JSON object:\n"
                "{\n"
                '  "amount": <number>,\n'
                '  "expense_date": "<YYYY-MM-DD>",\n'
                '  "suggested_category_name": "<Best matching category from list>",\n'
                '  "payment_mode": "<Cash, UPI, Card, or Net Banking>",\n'
                '  "note": "<Cleaned short description>",\n'
                '  "confidence": <float between 0.0 and 1.0>\n'
                "}"
            )

            contents = [{"parts": [{"text": prompt}]}]
            raw_json = await self._call_gemini(contents)
            try:
                parsed = json.loads(raw_json)
            except json.JSONDecodeError:
                cleaned = raw_json.strip().lstrip("```json").rstrip("```").strip()
                parsed = json.loads(cleaned)

            suggested_name = parsed.get("suggested_category_name")
            cat_id = None
            if suggested_name:
                for c in user_categories:
                    if c.get("name", "").lower() == suggested_name.lower():
                        cat_id = c.get("id")
                        break

            expense_date_val = current_date
            if parsed.get("expense_date"):
                try:
                    expense_date_val = date.fromisoformat(parsed["expense_date"])
                except ValueError:
                    expense_date_val = current_date

            return ExpenseParseResponse(
                amount=float(parsed.get("amount", 100.0)),
                expense_date=expense_date_val,
                suggested_category_name=suggested_name,
                suggested_category_id=cat_id,
                payment_mode=parsed.get("payment_mode", "UPI"),
                note=parsed.get("note", text),
                confidence=float(parsed.get("confidence", 0.95)),
            )
        except Exception as e:
            logger.warning(f"Gemini parse_expense_text failed ({e}), falling back to MockAIProvider.")
            return await self.fallback_provider.parse_expense_text(text, user_categories, current_date)

    async def chat(
        self,
        message: str,
        history: List[AIChatMessage],
        context: Dict[str, Any],
    ) -> AIChatResponse:
        try:
            system_instruction = (
                "You are 'Kharcha AI' (Copilot), a warm, intelligent personal expense and budget advisor for KharchyaPani.\n"
                "You communicate clearly, concisely, and encouragingly in English.\n"
                f"Here is the user's private financial summary for this month:\n"
                f"- Total spent this month: ₹{context.get('monthly_total', 0):,.2f}\n"
                f"- Monthly budget limit: ₹{context.get('monthly_budget', 0):,.2f}\n"
                f"- Top spending category: {context.get('top_category', 'None')}\n"
                f"- Category breakdown: {json.dumps(context.get('category_totals', {}))}\n"
                "RULES:\n"
                "1. Give concise, encouraging, practical financial advice in English.\n"
                "2. Always return a valid JSON object with 'reply' (string) and 'suggested_actions' (list of objects with 'label' and 'href').\n"
                "Example JSON:\n"
                "{\n"
                '  "reply": "Your monthly expenses are well within your budget limit...",\n'
                '  "suggested_actions": [{"label": "View Expenses", "href": "/expenses"}]\n'
                "}"
            )

            formatted_contents = []
            for h in history[-6:]:
                role = "user" if h.role == "user" else "model"
                formatted_contents.append({"role": role, "parts": [{"text": h.content}]})

            formatted_contents.append({"role": "user", "parts": [{"text": message}]})

            raw_json = await self._call_gemini(formatted_contents, system_instruction=system_instruction)
            try:
                parsed = json.loads(raw_json)
            except json.JSONDecodeError:
                cleaned = raw_json.strip().lstrip("```json").rstrip("```").strip()
                parsed = json.loads(cleaned)

            actions = [
                SuggestedAction(label=a.get("label", "View"), href=a.get("href", "/"))
                for a in parsed.get("suggested_actions", [])
            ]
            if not actions:
                actions = [
                    SuggestedAction(label="View All Expenses", href="/expenses"),
                    SuggestedAction(label="Check Budgets", href="/budgets"),
                ]

            return AIChatResponse(
                reply=parsed.get("reply", "Hello! I am your Kharcha AI Copilot. How can I assist you with your finances today?"),
                suggested_actions=actions,
            )
        except Exception as e:
            logger.warning(f"Gemini chat failed ({e}), falling back to MockAIProvider.")
            return await self.fallback_provider.chat(message, history, context)


    async def generate_insights(
        self,
        context: Dict[str, Any],
    ) -> AIInsightsResponse:
        monthly_total = context.get("monthly_total", 0.0)
        monthly_budget = context.get("monthly_budget", 0.0)
        day_of_month = context.get("day_of_month", 1)
        days_in_month = context.get("days_in_month", 30)

        daily_velocity = monthly_total / max(1, day_of_month)
        projected = daily_velocity * days_in_month
        has_warning = bool(monthly_budget > 0 and projected > monthly_budget)

        prompt = (
            f"Analyze user spending velocity:\n"
            f"- Spent this month: ₹{monthly_total}\n"
            f"- Monthly budget: ₹{monthly_budget}\n"
            f"- Day of month: {day_of_month} of {days_in_month}\n"
            f"- Daily velocity: ₹{daily_velocity:.2f}/day\n"
            f"- Top categories: {json.dumps(context.get('category_totals', {}))}\n"
            "Return ONLY JSON:\n"
            "{\n"
            '  "warning_message": "<User-friendly warning or encouragement in English>",\n'
            '  "savings_tips": ["<Actionable tip 1 in English>", "<Actionable tip 2 in English>"]\n'
            "}"
        )

        contents = [{"parts": [{"text": prompt}]}]
        try:
            raw_json = await self._call_gemini(contents)
            parsed = json.loads(raw_json.strip().lstrip("```json").rstrip("```").strip())
            warning_msg = parsed.get("warning_message", "Your current spending is well-balanced.")
            tips = parsed.get("savings_tips", ["Keep tracking daily expenses to maximize your savings."])
        except Exception as e:
            logger.warning(f"Failed to generate Gemini insights, using math fallback: {e}")
            warning_msg = "Your current spending is well under control and within budget limits." if not has_warning else f"Your monthly budget is running out fast (Daily Velocity: ₹{daily_velocity:,.0f}/day)."
            tips = [
                "Keep an eye on weekend discretionary spending and dining out.",
                "Track daily micro UPI transactions to prevent small leaks in your budget.",
            ]

        exhaustion_date = None
        if has_warning and daily_velocity > 0:
            days_left = max(1, int((monthly_budget - monthly_total) / daily_velocity))
            exhaustion_date = f"the {min(days_in_month, day_of_month + days_left)}th of this month"

        return AIInsightsResponse(
            velocity_warning=VelocityWarning(
                has_warning=has_warning,
                category_name=context.get("top_category"),
                predicted_exhaustion_date=exhaustion_date,
                message=warning_msg,
            ),
            savings_tips=tips,
        )
