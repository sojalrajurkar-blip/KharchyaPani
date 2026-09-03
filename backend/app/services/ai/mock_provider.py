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
        # Pick category matching groceries or shopping if available, else first
        cat_id: Optional[int] = None
        cat_name = "Shopping"
        for c in user_categories:
            name_lower = c.get("name", "").lower()
            if any(k in name_lower for k in ("groc", "shop", "food", "किराणा", "खरेदी")):
                cat_id = c.get("id")
                cat_name = c.get("name")
                break
        if cat_id is None and user_categories:
            cat_id = user_categories[0].get("id")
            cat_name = user_categories[0].get("name", "Other")

        return ReceiptScanResponse(
            amount=485.50,
            expense_date=date.today(),
            merchant_name="Supermarket & General Store",
            suggested_category_name=cat_name,
            suggested_category_id=cat_id,
            payment_mode="UPI",
            note="पावती स्कॅन: किराणा सामान आणि दैनंदिन वस्तू (Sample Mock Scan)",
            confidence=0.96,
            raw_text="DMart Supermarket\nDate: Today\nItem 1: 150.00\nItem 2: 335.50\nTotal: 485.50\nPaid via UPI",
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
            reply = "नमस्कार! मी तुमचा **खर्चामित्र** AI सहाय्यक आहे. तुमच्या खर्चाचे विश्लेषण, बजेटची स्थिती किंवा सेव्हिंग्स टिप्सबद्दल मला काहीही विचारा!"
        elif any(w in msg_lower for w in ("बजेट", "budget", "शिल्लक", "उरले")):
            if monthly_budget > 0:
                rem = max(0.0, monthly_budget - monthly_total)
                pct = round((monthly_total / monthly_budget) * 100, 1)
                reply = f"या महिन्यासाठी तुमचे एकूण बजेट **₹{monthly_budget:,.2f}** आहे. आतापर्यंत तुम्ही **₹{monthly_total:,.2f}** ({pct}%) खर्च केले आहेत. बजेट पाळण्यासाठी तुमच्याकडे अजून **₹{rem:,.2f}** शिल्लक आहेत."
            else:
                reply = f"या महिन्यात तुमचा एकूण खर्च **₹{monthly_total:,.2f}** आहे. तुम्ही अजून मासिक बजेट सेट केलेले नाही. खर्चावर नियंत्रण ठेवण्यासाठी बजेट नक्की सेट करा!"
        elif any(w in msg_lower for w in ("कमी", "वाचवू", "save", "cut", "सल्ला")):
            reply = f"या महिन्यात तुमचा सर्वाधिक खर्च **'{top_cat}'** या कॅटेगरीमध्ये झाला आहे. शनिवार-रविवारचा अनावश्यक खर्च १०-१५% कमी केल्यास तुम्ही महिन्याला सहज ₹१,००० ते ₹१,५०० वाचवू शकता."
        else:
            reply = f"या महिन्यात तुमचा आतापर्यंतचा एकूण खर्च **₹{monthly_total:,.2f}** आहे, ज्यामध्ये सर्वाधिक खर्च **'{top_cat}'** वर झाला आहे. तुम्हाला कोणत्याही विशिष्ट कॅटेगरीचे विश्लेषण हवे असल्यास सांगा!"

        return AIChatResponse(
            reply=reply,
            suggested_actions=[
                SuggestedAction(label="सर्व खर्च पहा", href="/expenses"),
                SuggestedAction(label="बजेट तपासा", href="/budgets"),
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
                exhaustion_date = f"या महिन्याच्या {predicted_day} तारखेला"
                warning_msg = f"तुमच्या सध्याच्या दैनंदिन खर्चाच्या गतीने (Velocity: ₹{daily_velocity:,.0f}/दिवस) तुमचे मासिक बजेट {exhaustion_date} संपण्याची शक्यता आहे."

        if not has_warning:
            warning_msg = "तुमचा चालू महिन्याचा खर्च नियंत्रित असून बजेटच्या मर्यादेत आहे. अशीच शिस्त कायम ठेवा!"

        tips = [
            "वीकेंडला हॉटेलिंग किंवा ऑनलाइन फूड डिलिव्हरीवर होणारा खर्च १५% कमी केल्यास महिन्याला ₹१,२०० पर्यंत बचत होईल.",
            "दररोज UPI द्वारे होणारे ₹२०-₹५० चे लहान खर्च महिन्याअखेर मोठा आकडा बनतात, यावर लक्ष ठेवा.",
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
