import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

def make_request(method: str, path: str, data: dict = None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"} if data else {}
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
    print("=== STARTING LIVE E2E APPLICATION VERIFICATION ===")

    # 1. Health & DB Check
    status, health = make_request("GET", "/health")
    assert status == 200, f"Health check failed: {status}"
    assert health["status"] == "ok" and health["database"] == "connected"
    print("[OK] 1. Backend /health & PostgreSQL connection verified.")

    # 2. Create Category
    status, cat1 = make_request("POST", "/api/categories", {"name": "E2E Test Category"})
    assert status == 201, f"Category creation failed: {status}"
    cat1_id = cat1["id"]
    assert cat1["name"] == "E2E Test Category"
    print(f"[OK] 2. Created category '{cat1['name']}' (ID: {cat1_id}).")

    # 3. Edit Category
    status, cat1_up = make_request("PUT", f"/api/categories/{cat1_id}", {"name": "E2E Renamed Category"})
    assert status == 200, f"Category update failed: {status}"
    assert cat1_up["name"] == "E2E Renamed Category"
    print(f"[OK] 3. Updated category name to '{cat1_up['name']}'.")

    # 4. Duplicate Category Validation (409 Conflict)
    status, dup_err = make_request("POST", "/api/categories", {"name": "e2e renamed category"})
    assert status == 409, f"Expected 409 conflict for duplicate category, got {status}"
    print("[OK] 4. Duplicate category creation blocked with 409 Conflict.")

    # 5. Delete Category without linked expenses
    status, temp_cat = make_request("POST", "/api/categories", {"name": "Temp Cat"})
    assert status == 201
    status, _ = make_request("DELETE", f"/api/categories/{temp_cat['id']}")
    assert status == 204
    print("[OK] 5. Unlinked category deletion verified.")

    # 6. Create Expense
    expense_payload = {
        "amount": 750.50,
        "category_id": cat1_id,
        "expense_date": "2026-08-26",
        "note": "Live E2E test expense"
    }
    status, exp1 = make_request("POST", "/api/expenses", expense_payload)
    assert status == 201, f"Expense creation failed: {status}"
    exp1_id = exp1["id"]
    assert float(exp1["amount"]) == 750.50
    assert exp1["note"] == "Live E2E test expense"
    print(f"[OK] 6. Created expense ID {exp1_id} of RS 750.50.")

    # 7. View Expense
    status, exp_fetched = make_request("GET", f"/api/expenses/{exp1_id}")
    assert status == 200
    assert exp_fetched["category_name"] == "E2E Renamed Category"
    print("[OK] 7. Fetched expense details with category name join.")

    # 8. Edit Expense
    update_payload = {
        "amount": 850.75,
        "category_id": cat1_id,
        "expense_date": "2026-08-26",
        "note": "Updated live expense"
    }
    status, exp1_up = make_request("PUT", f"/api/expenses/{exp1_id}", update_payload)
    assert status == 200
    assert float(exp1_up["amount"]) == 850.75
    assert exp1_up["note"] == "Updated live expense"
    print("[OK] 8. Updated expense amount to RS 850.75.")

    # 9. Filtering Verification
    # Category Filter
    status, cat_filtered = make_request("GET", f"/api/expenses?category_id={cat1_id}")
    assert status == 200 and len(cat_filtered) == 1 and cat_filtered[0]["id"] == exp1_id
    print("[OK] 9a. Category filter verified.")

    # Date Filter
    status, date_filtered = make_request("GET", "/api/expenses?date=2026-08-26")
    assert status == 200 and any(item["id"] == exp1_id for item in date_filtered)
    print("[OK] 9b. Date filter verified.")

    # Date Range Filter
    status, range_filtered = make_request("GET", "/api/expenses?date_from=2026-08-01&date_to=2026-08-31")
    assert status == 200 and any(item["id"] == exp1_id for item in range_filtered)
    print("[OK] 9c. Date range filter verified.")

    # Combined Filter
    status, comb_filtered = make_request("GET", f"/api/expenses?category_id={cat1_id}&date_from=2026-08-01&date_to=2026-08-31")
    assert status == 200 and len(comb_filtered) == 1 and comb_filtered[0]["id"] == exp1_id
    print("[OK] 9d. Combined filter (Category + Date Range) verified.")

    # 10. Dashboard Aggregations
    status, dash = make_request("GET", "/api/dashboard")
    assert status == 200
    assert float(dash["total_expense"]) >= 850.75
    assert dash["expense_count"] >= 1
    assert any(item["category_id"] == cat1_id for item in dash["category_summary"])
    print("[OK] 10. Live dashboard aggregations verified.")

    # 11. Linked Category Deletion Block (409 Conflict)
    status, del_blocked = make_request("DELETE", f"/api/categories/{cat1_id}")
    assert status == 409
    assert "linked expense" in del_blocked["detail"]
    print("[OK] 11. Deletion of category with linked expenses blocked with 409 Conflict.")

    # 12. Expense Validation Edge Cases
    status, _ = make_request("POST", "/api/expenses", {"amount": -10, "category_id": cat1_id, "expense_date": "2026-08-26"})
    assert status == 422
    print("[OK] 12. Validation blocked invalid expense amount <= 0.")

    # 13. Deletion & Cleanup
    status, _ = make_request("DELETE", f"/api/expenses/{exp1_id}")
    assert status == 204
    print(f"[OK] 13. Expense ID {exp1_id} deleted successfully.")

    status, _ = make_request("DELETE", f"/api/categories/{cat1_id}")
    assert status == 204
    print(f"[OK] 14. Category ID {cat1_id} deleted successfully after linked expense removal.")

    print("\nALL 14 E2E VERIFICATION CHECKS PASSED CLEANLY!")

if __name__ == "__main__":
    run_live_verification()
