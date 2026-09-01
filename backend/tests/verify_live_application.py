import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

def make_request(method: str, path: str, data: dict = None, token: str = None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"} if data else {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode('utf-8') if data else None

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            content = resp.read().decode('utf-8')
            json_data = json.loads(content) if content else None
            return status, json_data
    except urllib.error.HTTPError as e:
        content = e.read().decode('utf-8')
        json_data = json.loads(content) if content else None
        return e.code, json_data

def run_live_verification():
    print("=== STARTING LIVE E2E APPLICATION VERIFICATION WITH AUTH ===")

    # 1. Health & DB Check (Public)
    status, health = make_request("GET", "/health")
    assert status == 200, f"Health check failed: {status}"
    assert health["status"] == "ok" and health["database"] == "connected"
    print("[OK] 1. Backend /health & PostgreSQL connection verified.")

    # 2. Register / Login Test User
    email = "live_e2e_user@example.com"
    pwd = "SecureE2EPassword123!"
    status, auth_data = make_request("POST", "/api/auth/register", {
        "email": email,
        "password": pwd,
        "full_name": "Live E2E User"
    })
    if status == 400: # Already exists
        status, auth_data = make_request("POST", "/api/auth/login", {
            "email": email,
            "password": pwd
        })
    assert status in (200, 201), f"Auth failed: {status}"
    token = auth_data["access_token"]
    print(f"[OK] 2. User authenticated successfully (User ID: {auth_data['user']['id']}).")

    # 3. Create Category
    status, cat1 = make_request("POST", "/api/categories", {"name": "E2E Test Category"}, token=token)
    assert status == 201, f"Category creation failed: {status}"
    cat1_id = cat1["id"]
    assert cat1["name"] == "E2E Test Category"
    print(f"[OK] 3. Created category '{cat1['name']}' (ID: {cat1_id}).")

    # 4. Edit Category
    status, cat1_up = make_request("PUT", f"/api/categories/{cat1_id}", {"name": "E2E Renamed Category"}, token=token)
    assert status == 200, f"Category update failed: {status}"
    assert cat1_up["name"] == "E2E Renamed Category"
    print(f"[OK] 4. Updated category name to '{cat1_up['name']}'.")

    # 5. Duplicate Category Validation (409 Conflict)
    status, dup_err = make_request("POST", "/api/categories", {"name": "e2e renamed category"}, token=token)
    assert status == 409, f"Expected 409 conflict for duplicate category, got {status}"
    print("[OK] 5. Duplicate category creation blocked with 409 Conflict.")

    # 6. Delete Category without linked expenses
    status, temp_cat = make_request("POST", "/api/categories", {"name": "Temp Cat"}, token=token)
    assert status == 201
    status, _ = make_request("DELETE", f"/api/categories/{temp_cat['id']}", token=token)
    assert status == 204
    print("[OK] 6. Unlinked category deletion verified.")

    # 7. Create Expense
    expense_payload = {
        "amount": 750.50,
        "category_id": cat1_id,
        "expense_date": "2026-08-26",
        "payment_mode": "UPI",
        "note": "Live E2E test expense"
    }
    status, exp1 = make_request("POST", "/api/expenses", expense_payload, token=token)
    assert status == 201, f"Expense creation failed: {status}"
    exp1_id = exp1["id"]
    assert float(exp1["amount"]) == 750.50
    assert exp1["note"] == "Live E2E test expense"
    print(f"[OK] 7. Created expense ID {exp1_id} of RS 750.50.")

    # 8. View Expense
    status, exp_fetched = make_request("GET", f"/api/expenses/{exp1_id}", token=token)
    assert status == 200
    assert exp_fetched["category_name"] == "E2E Renamed Category"
    print("[OK] 8. Fetched expense details with category name join.")

    # 9. Edit Expense
    update_payload = {
        "amount": 850.75,
        "category_id": cat1_id,
        "expense_date": "2026-08-26",
        "payment_mode": "UPI",
        "note": "Updated live expense"
    }
    status, exp1_up = make_request("PUT", f"/api/expenses/{exp1_id}", update_payload, token=token)
    assert status == 200
    assert float(exp1_up["amount"]) == 850.75
    assert exp1_up["note"] == "Updated live expense"
    print("[OK] 9. Updated expense amount to RS 850.75.")

    # 10. Filtering Verification
    status, cat_filtered = make_request("GET", f"/api/expenses?category_id={cat1_id}", token=token)
    assert status == 200 and len(cat_filtered) == 1 and cat_filtered[0]["id"] == exp1_id
    print("[OK] 10. Filter verified.")

    # 11. Dashboard Aggregations
    status, dash = make_request("GET", "/api/dashboard", token=token)
    assert status == 200
    assert float(dash["total_expense"]) >= 850.75
    assert dash["expense_count"] >= 1
    print("[OK] 11. Live dashboard aggregations verified.")

    # 12. Linked Category Deletion Block (409 Conflict)
    status, del_blocked = make_request("DELETE", f"/api/categories/{cat1_id}", token=token)
    assert status == 409
    assert "linked expense" in del_blocked["detail"]
    print("[OK] 12. Deletion of category with linked expenses blocked with 409 Conflict.")

    # 13. Deletion & Cleanup
    status, _ = make_request("DELETE", f"/api/expenses/{exp1_id}", token=token)
    assert status == 204
    print(f"[OK] 13. Expense ID {exp1_id} deleted successfully.")

    status, _ = make_request("DELETE", f"/api/categories/{cat1_id}", token=token)
    assert status == 204
    print(f"[OK] 14. Category ID {cat1_id} deleted successfully after linked expense removal.")

    print("\nALL 14 E2E VERIFICATION CHECKS PASSED CLEANLY WITH AUTHENTICATION!")

if __name__ == "__main__":
    run_live_verification()
