import io
from datetime import date, timedelta

def test_ai_parse_expense_marathi(client, auth_headers):
    payload = {"text": "काल मित्रांसोबत चहा नाश्ता केला ₹150 UPI ने"}
    res = client.post("/api/ai/parse-expense", headers=auth_headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["amount"] == 150.0
    assert data["payment_mode"] == "UPI"
    assert data["confidence"] > 0.5
    # Date should be yesterday
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    assert data["expense_date"] == yesterday

def test_ai_parse_expense_english(client, auth_headers):
    payload = {"text": "Grocery shopping at DMart 450 rs today via cash"}
    res = client.post("/api/ai/parse-expense", headers=auth_headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["amount"] == 450.0
    assert data["payment_mode"] == "Cash"
    assert data["expense_date"] == date.today().isoformat()

def test_ai_scan_receipt(client, auth_headers):
    # Create a small in-memory dummy image file
    dummy_image = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00")
    files = {"file": ("test_receipt.jpg", dummy_image, "image/jpeg")}
    res = client.post("/api/ai/scan-receipt", headers=auth_headers, files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["amount"] is not None
    assert data["amount"] > 0
    assert data["merchant_name"] is not None
    assert data["confidence"] > 0.5

def test_ai_chat_kharchamitra(client, auth_headers):
    payload = {
        "message": "या महिन्यात माझा एकूण खर्च किती झाला?",
        "history": []
    }
    res = client.post("/api/ai/chat", headers=auth_headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert len(data["reply"]) > 0
    assert "suggested_actions" in data
    assert len(data["suggested_actions"]) > 0

def test_ai_insights(client, auth_headers):
    res = client.get("/api/ai/insights", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "velocity_warning" in data
    assert "savings_tips" in data
    assert isinstance(data["savings_tips"], list)
    assert len(data["savings_tips"]) > 0

def test_ai_unauthenticated_rejected(client):
    res1 = client.post("/api/ai/parse-expense", json={"text": "coffee 50"})
    assert res1.status_code == 401

    res2 = client.post("/api/ai/chat", json={"message": "hi"})
    assert res2.status_code == 401

    res3 = client.get("/api/ai/insights")
    assert res3.status_code == 401
