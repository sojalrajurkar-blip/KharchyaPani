def test_category_validation_edge_cases(client, auth_headers):
    # Empty / whitespace category name
    res1 = client.post("/api/categories", headers=auth_headers, json={"name": "   "})
    assert res1.status_code == 422

    # Category name exceeding 100 characters
    res2 = client.post("/api/categories", headers=auth_headers, json={"name": "A" * 101})
    assert res2.status_code == 422

    # GET non-existent category
    res3 = client.get("/api/categories/999999", headers=auth_headers)
    assert res3.status_code == 404

    # PUT non-existent category
    res4 = client.put("/api/categories/999999", headers=auth_headers, json={"name": "NonExistent"})
    assert res4.status_code == 404

    # DELETE non-existent category
    res5 = client.delete("/api/categories/999999", headers=auth_headers)
    assert res5.status_code == 404

def test_expense_validation_edge_cases(client, auth_headers):
    # Fetch valid category
    cat_res = client.get("/api/categories", headers=auth_headers)
    cat_id = cat_res.json()[0]["id"]

    # Amount = 0
    res1 = client.post("/api/expenses", headers=auth_headers, json={
        "amount": 0,
        "category_id": cat_id,
        "expense_date": "2026-08-26"
    })
    assert res1.status_code == 422

    # Note exceeding 500 characters
    res2 = client.post("/api/expenses", headers=auth_headers, json={
        "amount": 100,
        "category_id": cat_id,
        "expense_date": "2026-08-26",
        "note": "X" * 501
    })
    assert res2.status_code == 422

    # Invalid ISO date
    res3 = client.post("/api/expenses", headers=auth_headers, json={
        "amount": 100,
        "category_id": cat_id,
        "expense_date": "not-a-valid-date"
    })
    assert res3.status_code == 422

    # GET non-existent expense
    res4 = client.get("/api/expenses/999999", headers=auth_headers)
    assert res4.status_code == 404

    # PUT non-existent expense
    res5 = client.put("/api/expenses/999999", headers=auth_headers, json={
        "amount": 100,
        "category_id": cat_id,
        "expense_date": "2026-08-26"
    })
    assert res5.status_code == 404

    # DELETE non-existent expense
    res6 = client.delete("/api/expenses/999999", headers=auth_headers)
    assert res6.status_code == 404
