from datetime import date

def test_expenses_crud_and_validation(client):
    # Fetch existing category
    cat_res = client.get("/api/categories")
    cat_id = cat_res.json()[0]["id"]

    # 1. Validation errors
    # Amount <= 0
    res_inv_amount = client.post("/api/expenses", json={
        "amount": -50,
        "category_id": cat_id,
        "expense_date": "2026-08-26"
    })
    assert res_inv_amount.status_code == 422

    # Non-existent category
    res_inv_cat = client.post("/api/expenses", json={
        "amount": 50,
        "category_id": 999999,
        "expense_date": "2026-08-26"
    })
    assert res_inv_cat.status_code == 404

    # 2. Create valid expense
    exp_res = client.post("/api/expenses", json={
        "amount": 250.75,
        "category_id": cat_id,
        "expense_date": "2026-08-26",
        "note": "Lunch with colleagues"
    })
    assert exp_res.status_code == 201
    exp_data = exp_res.json()
    exp_id = exp_data["id"]
    assert float(exp_data["amount"]) == 250.75
    assert exp_data["note"] == "Lunch with colleagues"

    # 3. Get expense by ID
    get_res = client.get(f"/api/expenses/{exp_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == exp_id

    # 4. Update expense
    up_res = client.put(f"/api/expenses/{exp_id}", json={
        "amount": 300.00,
        "category_id": cat_id,
        "expense_date": "2026-08-26",
        "note": "Updated lunch cost"
    })
    assert up_res.status_code == 200
    assert float(up_res.json()["amount"]) == 300.00

    # 5. Delete expense
    del_res = client.delete(f"/api/expenses/{exp_id}")
    assert del_res.status_code == 204

def test_expenses_filtering(client):
    # Setup test categories and expenses
    cat1_res = client.post("/api/categories", json={"name": "FilterCat_1"})
    cat2_res = client.post("/api/categories", json={"name": "FilterCat_2"})
    cat1_id = cat1_res.json()["id"]
    cat2_id = cat2_res.json()["id"]

    e1 = client.post("/api/expenses", json={"amount": 100, "category_id": cat1_id, "expense_date": "2026-08-01"}).json()
    e2 = client.post("/api/expenses", json={"amount": 200, "category_id": cat1_id, "expense_date": "2026-08-15"}).json()
    e3 = client.post("/api/expenses", json={"amount": 300, "category_id": cat2_id, "expense_date": "2026-08-20"}).json()

    # Filter by category
    res_cat = client.get(f"/api/expenses?category_id={cat1_id}")
    assert res_cat.status_code == 200
    items = res_cat.json()
    assert len(items) == 2
    assert all(item["category_id"] == cat1_id for item in items)

    # Filter by date range
    res_range = client.get("/api/expenses?date_from=2026-08-10&date_to=2026-08-18")
    assert res_range.status_code == 200
    range_items = res_range.json()
    assert len(range_items) == 1
    assert range_items[0]["id"] == e2["id"]

    # Combined filter
    res_comb = client.get(f"/api/expenses?category_id={cat1_id}&date_from=2026-08-01&date_to=2026-08-10")
    assert res_comb.status_code == 200
    comb_items = res_comb.json()
    assert len(comb_items) == 1
    assert comb_items[0]["id"] == e1["id"]

    # Cleanup
    client.delete(f"/api/expenses/{e1['id']}")
    client.delete(f"/api/expenses/{e2['id']}")
    client.delete(f"/api/expenses/{e3['id']}")
    client.delete(f"/api/categories/{cat1_id}")
    client.delete(f"/api/categories/{cat2_id}")
