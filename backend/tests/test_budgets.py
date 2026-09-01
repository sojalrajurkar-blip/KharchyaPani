import pytest
from fastapi.testclient import TestClient

def test_budget_crud_and_status(client: TestClient, auth_headers):
    # 1. Create Category first
    cat_res = client.post("/api/categories", headers=auth_headers, json={"name": "Groceries"})
    assert cat_res.status_code == 201
    cat_id = cat_res.json()["id"]

    # 2. Create Daily Budget
    daily_res = client.post("/api/budgets", headers=auth_headers, json={
        "period_type": "daily",
        "category_id": None,
        "amount_limit": 500.00
    })
    assert daily_res.status_code == 201
    daily_data = daily_res.json()
    assert daily_data["period_type"] == "daily"
    assert float(daily_data["amount_limit"]) == 500.00

    # 3. Create Monthly Category Budget
    cat_budget_res = client.post("/api/budgets", headers=auth_headers, json={
        "period_type": "monthly",
        "category_id": cat_id,
        "amount_limit": 3000.00
    })
    assert cat_budget_res.status_code == 201

    # 4. List budgets
    list_res = client.get("/api/budgets", headers=auth_headers)
    assert list_res.status_code == 200
    budgets = list_res.json()
    assert len(budgets) >= 2

    # 5. Get Budget status
    status_res = client.get("/api/budgets/status", headers=auth_headers)
    assert status_res.status_code == 200
    statuses = status_res.json()
    assert len(statuses) >= 2

    # 6. Add Expense with payment_mode UPI
    exp_res = client.post("/api/expenses", headers=auth_headers, json={
        "amount": 150.00,
        "category_id": cat_id,
        "expense_date": "2026-08-27",
        "payment_mode": "UPI",
        "note": "Supermarket purchase"
    })
    assert exp_res.status_code == 201
    exp_data = exp_res.json()
    assert exp_data["payment_mode"] == "UPI"

    # 7. Filter expenses by payment_mode
    upi_filter = client.get("/api/expenses?payment_mode=UPI", headers=auth_headers)
    assert upi_filter.status_code == 200
    assert len(upi_filter.json()) >= 1

    # 8. Check Dashboard includes payment_mode_summary
    dash_res = client.get("/api/dashboard", headers=auth_headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert "payment_mode_summary" in dash_data
    assert len(dash_data["payment_mode_summary"]) >= 1
