import re
from typing import List, Dict, Any, Optional
from datetime import date, timedelta
from app.services.ai.base import BaseAIProvider
from app.schemas.ai import (
    ReceiptScanResponse,
    ExpenseParseResponse,
    AIChatMessage,
    AIChatResponse,
    SuggestedAction,
    VelocityWarning,
    AIInsightsResponse,
)

class MockAIProvider(BaseAIProvider):
    """Deterministic, offline AI provider for testing and zero-API-key development."""

    async def scan_receipt(
        self,
        image_bytes: bytes,
        mime_type: str,
        user_categories: List[Dict[str, Any]],
    ) -> ReceiptScanResponse:
        import hashlib
        img_hash = int(hashlib.md5(image_bytes).hexdigest()[:6], 16)
        calc_amount = round(50.0 + (img_hash % 2000) * 0.5, 2)
        merchants = ["Cafe Coffee Day", "Metro Fuel Station", "City Mart", "Apollo Medical", "Spice Garden Restaurant"]
        merchant = merchants[img_hash % len(merchants)]

        # Pick category matching user categories or based on hash
        cat_id: Optional[int] = None
        cat_name = "Shopping"
        if user_categories:
            selected_cat = user_categories[img_hash % len(user_categories)]
            cat_id = selected_cat.get("id")
            cat_name = selected_cat.get("name", "Shopping")

        return ReceiptScanResponse(
            amount=calc_amount,
            expense_date=date.today(),
            merchant_name=merchant,
            suggested_category_name=cat_name,
            suggested_category_id=cat_id,
            payment_mode="UPI" if img_hash % 2 == 0 else "Card",
            note=f"Receipt scan from {merchant} (Total: ₹{calc_amount})",
            confidence=0.92,
            raw_text=f"{merchant}\nDate: {date.today()}\nTotal: {calc_amount}",
        )

    async def parse_expense_text(
        self,
        text: str,
        user_categories: List[Dict[str, Any]],
        current_date: date,
    ) -> ExpenseParseResponse:
        text_lower = text.lower()

        # 1. Extract amount (look for numbers like ₹120, 120 rs, 120.50)
        amount = 100.0
        amount_match = re.search(r'(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)\s*(?:₹|rs\.?|rupees|रुपये)?', text_lower)
        if amount_match:
            try:
                val = float(amount_match.group(1))
                if val > 0:
                    amount = val
            except ValueError:
                pass

        # 2. Extract date (check for yesterday / काल / পরশু)
        expense_date = current_date
        if any(w in text_lower for w in ("काल", "yesterday")):
            expense_date = current_date - timedelta(days=1)
        elif any(w in text_lower for w in ("परवा", "day before yesterday")):
            expense_date = current_date - timedelta(days=2)

        # 3. Extract category
        cat_id: Optional[int] = None
        cat_name: Optional[str] = None
        
        # Keyword mappings
        food_keywords = ("चहा", "नाश्ता", "वडापाव", "जेवण", "हॉटेल", "food", "chai", "coffee", "lunch", "dinner", "swiggy", "zomato", "cafe")
        travel_keywords = ("पेट्रोल", "रिक्षा", "auto", "metro", "bus", "travel", "cab", "uber", "ola", "diesel", "प्रवास")
        bills_keywords = ("बिल", "light", "recharge", "wifi", "bill", "electricity", "rent", "भाडे")
        health_keywords = ("औषध", "medicine", "doctor", "hospital", "medical")

        target_group = None
        if any(k in text_lower for k in food_keywords):
            target_group = ("food", "खाद्य", "drinks")
        elif any(k in text_lower for k in travel_keywords):
            target_group = ("travel", "fuel", "प्रवास")
        elif any(k in text_lower for k in bills_keywords):
            target_group = ("bill", "utilities", "बिल")
        elif any(k in text_lower for k in health_keywords):
            target_group = ("health", "medical", "आरोग्य")

        if target_group:
            for c in user_categories:
                c_lower = c.get("name", "").lower()
                if any(tg in c_lower for tg in target_group):
                    cat_id = c.get("id")
                    cat_name = c.get("name")
                    break

        if cat_id is None and user_categories:
            cat_id = user_categories[0].get("id")
            cat_name = user_categories[0].get("name")

        # 4. Payment mode
        payment_mode = "UPI"
        if any(w in text_lower for w in ("cash", "रोख")):
            payment_mode = "Cash"
        elif any(w in text_lower for w in ("card", "कार्ड", "debit", "credit")):
            payment_mode = "Card"
        elif any(w in text_lower for w in ("net banking", "netbanking", "बँक")):
            payment_mode = "Net Banking"

        # 5. Clean note
        note = text.strip()

        return ExpenseParseResponse(
            amount=amount,
            expense_date=expense_date,
            suggested_category_name=cat_name,
            suggested_category_id=cat_id,
            payment_mode=payment_mode,
            note=note,
            confidence=0.98,
        )

    async def chat(
        self,
        message: str,
        history: List[AIChatMessage],
        context: Dict[str, Any],
    ) -> AIChatResponse:
        monthly_total = context.get("monthly_total", 0.0)
        top_cat = context.get("top_category", "Food")
        monthly_budget = context.get("monthly_budget", 0.0)

        msg_lower = message.lower()
        if any(w in msg_lower for w in ("हॅलो", "hello", "hi", "namaskar", "नमस्कार")):
            reply = "Hello! I am your **Kharcha AI** Copilot assistant. Ask me anything about your spending analysis, budget status, or smart savings tips!"
        elif any(w in msg_lower for w in ("बजेट", "budget", "शिल्लक", "उरले", "limit", "remaining")):
            if monthly_budget > 0:
                rem = max(0.0, monthly_budget - monthly_total)
                pct = round((monthly_total / monthly_budget) * 100, 1)
                reply = f"Your total budget for this month is **₹{monthly_budget:,.2f}**. You have spent **₹{monthly_total:,.2f}** ({pct}%) so far. You still have **₹{rem:,.2f}** remaining to stay within your limit."
            else:
                reply = f"Your total spending this month is **₹{monthly_total:,.2f}**. You have not set a monthly budget yet. Setting a budget helps you monitor and control your spending effectively!"
        elif any(w in msg_lower for w in ("कमी", "वाचवू", "save", "cut", "सल्ला", "tip", "reduce")):
            reply = f"Your highest spending category this month is **'{top_cat}'**. Reducing non-essential weekend expenses by 10-15% could easily save you ₹1,000 to ₹1,500 every month."
        else:
            reply = f"Your total spending so far this month is **₹{monthly_total:,.2f}**, with the highest amount spent on **'{top_cat}'**. Let me know if you would like an in-depth breakdown of any specific category!"

        return AIChatResponse(
            reply=reply,
            suggested_actions=[
                SuggestedAction(label="View All Expenses", href="/expenses"),
                SuggestedAction(label="Check Budgets", href="/budgets"),
            ],
        )

    async def generate_insights(
        self,
        context: Dict[str, Any],
    ) -> AIInsightsResponse:
        monthly_total = context.get("monthly_total", 0.0)
        monthly_budget = context.get("monthly_budget", 0.0)
        days_in_month = context.get("days_in_month", 30)
        day_of_month = context.get("day_of_month", 1)

        has_warning = False
        warning_msg = ""
        cat_name = context.get("top_category", "General")
        exhaustion_date = None

        if monthly_budget > 0 and monthly_total > 0 and day_of_month > 0:
            daily_velocity = monthly_total / day_of_month
            projected_spend = daily_velocity * days_in_month
            if projected_spend > monthly_budget:
                has_warning = True
                days_left = max(1, int((monthly_budget - monthly_total) / daily_velocity)) if daily_velocity > 0 else 10
                predicted_day = min(days_in_month, day_of_month + days_left)
                exhaustion_date = f"the {predicted_day}th of this month"
                warning_msg = f"At your current daily spending rate of ₹{daily_velocity:,.0f}/day, your monthly budget is projected to run out by {exhaustion_date}."

        if not has_warning:
            warning_msg = "Your current month's spending is well under control and within budget limits. Keep up the great financial discipline!"

        tips = [
            "Cutting down on weekend dining out or online food delivery by 15% can save up to ₹1,200 each month.",
            "Keep track of daily micro UPI payments (₹20–₹50), as they accumulate into a substantial amount by month-end.",
        ]

        return AIInsightsResponse(
            velocity_warning=VelocityWarning(
                has_warning=has_warning,
                category_name=cat_name,
                predicted_exhaustion_date=exhaustion_date,
                message=warning_msg,
            ),
            savings_tips=tips,
        )
