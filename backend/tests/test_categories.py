def test_categories_crud_and_conflict(client, auth_headers):
    # 1. List categories (seed categories exist)
    res = client.get("/api/categories", headers=auth_headers)
    assert res.status_code == 200
    categories = res.json()
    assert len(categories) >= 7

    # 2. Create category
    cat_name = "TestCategory_Unique1"
    res = client.post("/api/categories", headers=auth_headers, json={"name": cat_name})
    assert res.status_code == 201
    created = res.json()
    cat_id = created["id"]
    assert created["name"] == cat_name

    # 3. Duplicate name (case-insensitive)
    res_dup = client.post("/api/categories", headers=auth_headers, json={"name": cat_name.lower()})
    assert res_dup.status_code == 409
    assert "already exists" in res_dup.json()["detail"]

    # 4. Update category
    updated_name = "TestCategory_Renamed1"
    res_up = client.put(f"/api/categories/{cat_id}", headers=auth_headers, json={"name": updated_name})
    assert res_up.status_code == 200
    assert res_up.json()["name"] == updated_name

    # 5. Delete category without expenses
    res_del = client.delete(f"/api/categories/{cat_id}", headers=auth_headers)
    assert res_del.status_code == 204

    # Verify deleted
    res_get = client.get(f"/api/categories/{cat_id}", headers=auth_headers)
    assert res_get.status_code == 404

def test_delete_category_blocked_when_expenses_linked(client, auth_headers):
    # Create category and expense linked to it
    cat_res = client.post("/api/categories", headers=auth_headers, json={"name": "LinkedCat_Test"})
    assert cat_res.status_code == 201
    cat_id = cat_res.json()["id"]

    exp_res = client.post("/api/expenses", headers=auth_headers, json={
        "amount": 100.50,
        "category_id": cat_id,
        "expense_date": "2026-08-26",
        "note": "Test expense linked"
    })
    assert exp_res.status_code == 201
    exp_id = exp_res.json()["id"]

    # Attempt to delete linked category -> Expect 409
    del_res = client.delete(f"/api/categories/{cat_id}", headers=auth_headers)
    assert del_res.status_code == 409
    assert "linked expense" in del_res.json()["detail"]

    # Cleanup expense, then delete category
    client.delete(f"/api/expenses/{exp_id}", headers=auth_headers)
    client.delete(f"/api/categories/{cat_id}", headers=auth_headers)
