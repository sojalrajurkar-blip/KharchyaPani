def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"

def test_contact_endpoint(client):
    response = client.get("/api/contact")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "email" in data
