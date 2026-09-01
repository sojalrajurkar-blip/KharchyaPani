def test_dashboard_summary_aggregations(client, auth_headers):
    # Fetch initial dashboard
    res_init = client.get("/api/dashboard", headers=auth_headers)
    assert res_init.status_code == 200
    data_init = res_init.json()
    assert "total_expense" in data_init
    assert "expense_count" in data_init
    assert "recent_expenses" in data_init
    assert "category_summary" in data_init

    initial_total = float(data_init["total_expense"])
    initial_count = data_init["expense_count"]

    # Add expense
    cat_res = client.get("/api/categories", headers=auth_headers)
    cat_id = cat_res.json()[0]["id"]

    exp_res = client.post("/api/expenses", headers=auth_headers, json={
        "amount": 500.00,
        "category_id": cat_id,
        "expense_date": "2026-08-26",
        "note": "Dashboard aggregation test"
    })
    exp_id = exp_res.json()["id"]

    # Verify dashboard updated
    res_after = client.get("/api/dashboard", headers=auth_headers)
    data_after = res_after.json()
    assert float(data_after["total_expense"]) == initial_total + 500.00
    assert data_after["expense_count"] == initial_count + 1

    # Cleanup
    client.delete(f"/api/expenses/{exp_id}", headers=auth_headers)

    # Verify totals reverted
    res_final = client.get("/api/dashboard", headers=auth_headers)
    data_final = res_final.json()
    assert float(data_final["total_expense"]) == initial_total
    assert data_final["expense_count"] == initial_count
