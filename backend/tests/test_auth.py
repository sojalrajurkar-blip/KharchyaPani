import pytest
from fastapi.testclient import TestClient
from app.core.security import decode_access_token

def test_register_success(client: TestClient):
    resp = client.post("/api/auth/register", json={
        "email": "newuser@example.com",
        "password": "SecurePassword123!",
        "full_name": "New User"
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["full_name"] == "New User"
    # Ensure refresh cookie is set
    assert "kharchyapani_refresh_token" in resp.cookies

def test_register_duplicate_email(client: TestClient, auth_user):
    resp = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "Password123!",
        "full_name": "Duplicate"
    })
    assert resp.status_code == 400
    assert "already exists" in resp.json()["detail"].lower()

def test_login_success(client: TestClient, auth_user):
    resp = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "Password123!"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    payload = decode_access_token(data["access_token"])
    assert payload["sub"] == str(auth_user.id)
    assert "kharchyapani_refresh_token" in resp.cookies

def test_login_invalid_credentials(client: TestClient):
    resp = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "WrongPassword!"
    })
    assert resp.status_code == 401
    assert "invalid" in resp.json()["detail"].lower()

def test_refresh_token_rotation(client: TestClient, auth_user):
    # First login to get a cookie
    login_resp = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "Password123!"
    })
    old_cookie = login_resp.cookies.get("kharchyapani_refresh_token")
    assert old_cookie is not None

    # Call refresh endpoint with the cookie
    refresh_resp = client.post("/api/auth/refresh", cookies={"kharchyapani_refresh_token": old_cookie})
    assert refresh_resp.status_code == 200
    new_data = refresh_resp.json()
    assert "access_token" in new_data
    new_cookie = refresh_resp.cookies.get("kharchyapani_refresh_token")
    assert new_cookie is not None
    assert new_cookie != old_cookie

    # Clear persistent test client cookie jar to test old revoked token explicitly
    client.cookies.clear()

    # Attempt to reuse the old revoked refresh token -> should be rejected!
    reuse_resp = client.post("/api/auth/refresh", headers={"X-Refresh-Token": old_cookie})
    assert reuse_resp.status_code == 401

def test_logout(client: TestClient):
    login_resp = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "Password123!"
    })
    cookie = login_resp.cookies.get("kharchyapani_refresh_token")
    
    logout_resp = client.post("/api/auth/logout", cookies={"kharchyapani_refresh_token": cookie})
    assert logout_resp.status_code == 200
    
    # Verify token cannot be used to refresh anymore
    refresh_resp = client.post("/api/auth/refresh", cookies={"kharchyapani_refresh_token": cookie})
    assert refresh_resp.status_code == 401

def test_logout_all_devices(client: TestClient, auth_headers):
    resp = client.post("/api/auth/logout-all", headers=auth_headers)
    assert resp.status_code == 200
    assert "all devices" in resp.json()["message"].lower()

def test_forgot_and_reset_password_flow(client: TestClient):
    # Register separate user for reset test
    client.post("/api/auth/register", json={
        "email": "resetuser@example.com",
        "password": "OldPassword123!",
        "full_name": "Reset User"
    })

    # Forgot password
    forgot_resp = client.post("/api/auth/forgot-password", json={"email": "resetuser@example.com"})
    assert forgot_resp.status_code == 200
    reset_token = forgot_resp.json().get("reset_token")
    assert reset_token is not None

    # Reset password
    reset_resp = client.post("/api/auth/reset-password", json={
        "token": reset_token,
        "new_password": "NewPassword456!"
    })
    assert reset_resp.status_code == 200

    # Old password fails
    fail_login = client.post("/api/auth/login", json={
        "email": "resetuser@example.com",
        "password": "OldPassword123!"
    })
    assert fail_login.status_code == 401

    # New password succeeds
    success_login = client.post("/api/auth/login", json={
        "email": "resetuser@example.com",
        "password": "NewPassword456!"
    })
    assert success_login.status_code == 200

def test_get_current_user_profile(client: TestClient, auth_headers, auth_user):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == auth_user.id
    assert data["email"] == auth_user.email

def test_google_auth_dev_mode_provisioning(client: TestClient):
    resp = client.post("/api/auth/google", json={
        "credential": "dev_google_user:googleuser@example.com:Google User"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "googleuser@example.com"
    assert data["user"]["full_name"] == "Google User"
    assert "kharchyapani_refresh_token" in resp.cookies

def test_google_auth_account_linking(client: TestClient, auth_user):
    # Linking existing email account to Google ID
    resp = client.post("/api/auth/google", json={
        "credential": f"dev_google_user:{auth_user.email}:{auth_user.full_name}"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["id"] == auth_user.id
    assert data["user"]["email"] == auth_user.email

