import pytest
from fastapi.testclient import TestClient

def test_user_data_isolation_expenses(client: TestClient, auth_headers, second_auth_headers):
    # 1. Get User A's Food category ID
    cats_a = client.get("/api/categories", headers=auth_headers).json()
    cat_a_id = cats_a[0]["id"]

    # 2. User A creates an expense
    create_resp = client.post("/api/expenses", headers=auth_headers, json={
        "amount": 750.00,
        "category_id": cat_a_id,
        "expense_date": "2026-08-31",
        "payment_mode": "UPI",
        "note": "User A Private Dinner"
    })
    assert create_resp.status_code == 201
    expense_a_id = create_resp.json()["id"]

    # 3. User B lists expenses -> Must NOT contain User A's expense
    list_b = client.get("/api/expenses", headers=second_auth_headers).json()
    assert all(e["id"] != expense_a_id for e in list_b)
    assert all("User A Private Dinner" not in (e.get("note") or "") for e in list_b)

    # 4. User B attempts GET /api/expenses/{id} -> Must return 404
    get_b = client.get(f"/api/expenses/{expense_a_id}", headers=second_auth_headers)
    assert get_b.status_code == 404

    # 5. User B attempts PUT /api/expenses/{id} -> Must return 404
    put_b = client.put(f"/api/expenses/{expense_a_id}", headers=second_auth_headers, json={
        "amount": 999.00,
        "category_id": cat_a_id,
        "expense_date": "2026-08-31",
        "payment_mode": "Cash",
        "note": "Hacked"
    })
    assert put_b.status_code == 404

    # 6. User B attempts DELETE /api/expenses/{id} -> Must return 404
    del_b = client.delete(f"/api/expenses/{expense_a_id}", headers=second_auth_headers)
    assert del_b.status_code == 404

    # 7. User A can still retrieve and delete their own expense
    get_a = client.get(f"/api/expenses/{expense_a_id}", headers=auth_headers)
    assert get_a.status_code == 200
    assert float(get_a.json()["amount"]) == 750.00

def test_user_cannot_use_other_user_category(client: TestClient, auth_headers, second_auth_headers):
    # User A creates a custom category
    cat_resp = client.post("/api/categories", headers=auth_headers, json={"name": "User A Secret Hobby"})
    assert cat_resp.status_code == 201
    cat_a_id = cat_resp.json()["id"]

    # User B attempts to create an expense using User A's category ID -> Must return 404
    exp_resp = client.post("/api/expenses", headers=second_auth_headers, json={
        "amount": 100.00,
        "category_id": cat_a_id,
        "expense_date": "2026-08-31",
        "payment_mode": "UPI"
    })
    assert exp_resp.status_code == 404
    assert "Category not found" in exp_resp.json()["detail"]

def test_user_data_isolation_dashboard_and_budgets(client: TestClient, auth_headers, second_auth_headers):
    # User A sets a daily budget
    client.post("/api/budgets", headers=auth_headers, json={
        "period_type": "daily",
        "category_id": None,
        "amount_limit": 5000.00
    })

    # User B checks budget status -> User A's budget does not appear in User B's list
    status_b = client.get("/api/budgets/status", headers=second_auth_headers).json()
    assert all(b.get("amount_limit") != 5000.00 for b in status_b)
