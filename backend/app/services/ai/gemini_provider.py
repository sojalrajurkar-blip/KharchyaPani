import json
import re
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
    """Production Google Gemini Flash AI Provider with multimodal OCR support."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""
        raw_model = settings.AI_MODEL.strip() if settings.AI_MODEL else "gemini-3.5-flash"
        if raw_model in ("gemini-flash-latest", "gemini-flash", "gemini-1.5-flash"):
            self.model = "gemini-3.5-flash"
        else:
            self.model = raw_model
        self.temperature = settings.AI_TEMPERATURE
        self.max_tokens = settings.AI_MAX_OUTPUT_TOKENS
        self.fallback_provider = MockAIProvider()

    def _get_candidate_models(self) -> List[str]:
        """Ordered list of candidate Gemini models to ensure maximum availability."""
        candidates = [
            self.model,
            "gemini-3.5-flash",
            "gemini-3.6-flash",
            "gemini-2.5-flash",
            "gemini-1.5-flash",
            "gemini-2.0-flash",
        ]
        # Preserve order while deduplicating
        seen = set()
        deduped = []
        for c in candidates:
            if c and c not in seen:
                seen.add(c)
                deduped.append(c)
        return deduped

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Extract and parse JSON safely from raw Gemini text responses."""
        cleaned = text.strip()
        # 1. Try direct JSON parse
        try:
            return json.loads(cleaned)
        except Exception:
            pass

        # 2. Try markdown fenced block ```json ... ``` or ``` ... ```
        fence_match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", cleaned, re.IGNORECASE)
        if fence_match:
            try:
                return json.loads(fence_match.group(1))
            except Exception:
                pass

        # 3. Find outer braces {...}
        brace_match = re.search(r"(\{[\s\S]*\})", cleaned)
        if brace_match:
            try:
                return json.loads(brace_match.group(1))
            except Exception:
                pass

        raise ValueError(f"Could not parse valid JSON from response: {text[:200]}")

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

        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key,
        }

        candidate_models = self._get_candidate_models()
        last_error = None

        async with httpx.AsyncClient(timeout=35.0) as client:
            for model_name in candidate_models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
                try:
                    resp = await client.post(
                        url,
                        json=payload,
                        headers=headers,
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                return parts[0]["text"]
                    elif resp.status_code == 400:
                        err_text = resp.text
                        logger.warning(f"Gemini API returned 400 bad request: {err_text}")
                        if "image" in err_text.lower() or "invalid_argument" in err_text.lower():
                            raise ValueError("Invalid or corrupted image format. Please ensure you upload a valid photo.")
                        raise ValueError(f"Invalid request to Gemini API: {err_text[:150]}")
                    elif resp.status_code == 404:
                        logger.warning(f"Model endpoint {model_name} returned 404, trying next candidate...")
                        last_error = f"Model {model_name} not found: {resp.text}"
                        continue
                    else:
                        logger.error(f"Gemini API returned status {resp.status_code} for {model_name}: {resp.text}")
                        last_error = f"Status {resp.status_code}: {resp.text}"
                except Exception as ex:
                    logger.error(f"Request error calling Gemini {model_name}: {ex}")
                    last_error = str(ex)
                    continue

        raise RuntimeError(f"Gemini API request failed across all candidate endpoints: {last_error}")

    async def scan_receipt(
        self,
        image_bytes: bytes,
        mime_type: str,
        user_categories: List[Dict[str, Any]],
    ) -> ReceiptScanResponse:
        """Process multimodal receipt OCR via Google Gemini API with dynamic extraction."""
        if not image_bytes:
            raise ValueError("Empty image file provided.")

        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        categories_list = [c.get("name") for c in user_categories if c.get("name")]
        categories_str = ", ".join(categories_list) if categories_list else "Food, Travel, Shopping, Bills, Health, Other"

        prompt = (
            "You are an expert OCR financial receipt parser. Analyze the attached receipt, bill, invoice, or payment screenshot carefully.\n"
            f"Available user categories: [{categories_str}].\n"
            "Extract transaction details accurately from the image.\n"
            "If the image is NOT a receipt/invoice or contains no legible financial data, set amount to null, confidence to 0.0, and describe in note.\n\n"
            "Return ONLY a JSON object with this exact structure:\n"
            "{\n"
            '  "amount": <positive number or null>,\n'
            '  "expense_date": "<YYYY-MM-DD or null>",\n'
            '  "merchant_name": "<Store / Merchant / Vendor / Provider name or null>",\n'
            '  "suggested_category_name": "<Best matching category from the available list above or general classification>",\n'
            '  "payment_mode": "<UPI, Cash, Card, Net Banking, or null>",\n'
            '  "note": "<Brief concise summary of purchased items/services>",\n'
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
        parsed = self._parse_json_response(raw_json)

        # 1. Parse amount cleanly
        amount_val: Optional[float] = None
        raw_amount = parsed.get("amount")
        if raw_amount is not None:
            try:
                if isinstance(raw_amount, (int, float)):
                    amount_val = float(raw_amount)
                elif isinstance(raw_amount, str):
                    clean_str = re.sub(r"[^\d.]", "", raw_amount)
                    if clean_str:
                        amount_val = float(clean_str)
            except (ValueError, TypeError):
                amount_val = None

        # 2. Parse category
        suggested_name = parsed.get("suggested_category_name")
        cat_id: Optional[int] = None
        if suggested_name:
            for c in user_categories:
                if c.get("name", "").strip().lower() == suggested_name.strip().lower():
                    cat_id = c.get("id")
                    suggested_name = c.get("name")
                    break
        if not cat_id and user_categories and suggested_name:
            for c in user_categories:
                if any(w in suggested_name.lower() for w in c.get("name", "").lower().split()):
                    cat_id = c.get("id")
                    suggested_name = c.get("name")
                    break

        # 3. Parse expense date
        expense_date_val: Optional[date] = None
        raw_date = parsed.get("expense_date")
        if raw_date and isinstance(raw_date, str):
            try:
                expense_date_val = date.fromisoformat(raw_date.strip())
            except ValueError:
                expense_date_val = None
        if not expense_date_val:
            expense_date_val = date.today()

        # 4. Confidence & Merchant
        confidence_val = float(parsed.get("confidence", 0.9)) if parsed.get("confidence") is not None else 0.85
        merchant_name_val = parsed.get("merchant_name")
        if isinstance(merchant_name_val, str) and merchant_name_val.strip().lower() in ("null", "none", "n/a", "unknown"):
            merchant_name_val = None

        payment_mode_val = parsed.get("payment_mode") or "UPI"
        if isinstance(payment_mode_val, str) and payment_mode_val.strip().lower() in ("null", "none"):
            payment_mode_val = "UPI"

        note_val = parsed.get("note")
        if isinstance(note_val, str) and note_val.strip().lower() in ("null", "none"):
            note_val = None

        return ReceiptScanResponse(
            amount=amount_val,
            expense_date=expense_date_val,
            merchant_name=merchant_name_val,
            suggested_category_name=suggested_name or "Shopping",
            suggested_category_id=cat_id,
            payment_mode=payment_mode_val,
            note=note_val,
            confidence=confidence_val,
            raw_text=raw_json[:300],
        )

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
            parsed = self._parse_json_response(raw_json)

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
            parsed = self._parse_json_response(raw_json)

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
            parsed = self._parse_json_response(raw_json)
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
