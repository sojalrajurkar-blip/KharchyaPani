from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.services.email_service import EmailService

def test_email_provider_determination():
    # Test explicit SMTP
    settings.EMAIL_PROVIDER = "smtp"
    assert settings.get_effective_email_provider() == "smtp"

    # Test explicit Resend
    settings.EMAIL_PROVIDER = "resend"
    assert settings.get_effective_email_provider() == "resend"

    # Test auto fallback in dev
    settings.EMAIL_PROVIDER = "auto"
    settings.APP_ENV = "development"
    settings.RESEND_API_KEY = ""
    assert settings.get_effective_email_provider() == "smtp"

    # Test auto detection when RESEND_API_KEY is present
    settings.RESEND_API_KEY = "re_test_key"
    assert settings.get_effective_email_provider() == "resend"

    # Reset
    settings.EMAIL_PROVIDER = "auto"
    settings.RESEND_API_KEY = ""

def test_send_email_via_smtp_mocked():
    with patch("smtplib.SMTP") as mock_smtp_cls:
        mock_instance = MagicMock()
        mock_smtp_cls.return_value = mock_instance
        mock_instance.__enter__.return_value = mock_instance

        success = EmailService._send_via_smtp(
            to_email="test@example.com",
            subject="Test Subject",
            html_content="<p>Test</p>",
            text_content="Test"
        )
        assert success is True
        assert mock_instance.sendmail.called

def test_send_email_via_resend_mocked():
    settings.RESEND_API_KEY = "re_fake_api_key"
    with patch("httpx.Client.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"id": "email_12345"}
        mock_post.return_value = mock_response

        success = EmailService._send_via_resend(
            to_email="test@example.com",
            subject="Test Resend",
            html_content="<p>Test</p>",
            text_content="Test"
        )
        assert success is True
        assert mock_post.called

    settings.RESEND_API_KEY = ""

def test_password_reset_email_template():
    with patch.object(EmailService, "send_email", return_value=True) as mock_send:
        success = EmailService.send_password_reset_email(
            to_email="test@example.com",
            token="sample_reset_token_xyz",
            user_name="John Doe"
        )
        assert success is True
        assert mock_send.called
        args, kwargs = mock_send.call_args
        assert args[0] == "test@example.com"
        assert "Password Reset" in args[1]
        assert "sample_reset_token_xyz" in args[2]  # HTML contains token link

def test_welcome_email_template():
    with patch.object(EmailService, "send_email", return_value=True) as mock_send:
        success = EmailService.send_welcome_email(
            to_email="newuser@example.com",
            user_name="Alice Wonderland"
        )
        assert success is True
        assert mock_send.called
        args, kwargs = mock_send.call_args
        assert args[0] == "newuser@example.com"
        assert "Welcome" in args[1]
        assert "Alice Wonderland" in args[2]

def test_register_flow_triggers_welcome_email(client: TestClient):
    with patch.object(EmailService, "send_welcome_email", return_value=True) as mock_welcome:
        resp = client.post("/api/auth/register", json={
            "email": "welcometest@example.com",
            "password": "SecurePassword123!",
            "full_name": "Welcome Tester"
        })
        assert resp.status_code == 201
        assert mock_welcome.called
        call_kwargs = mock_welcome.call_args.kwargs
        assert call_kwargs["to_email"] == "welcometest@example.com"
        assert call_kwargs["user_name"] == "Welcome Tester"

def test_forgot_password_flow_triggers_email(client: TestClient):
    # Register user
    client.post("/api/auth/register", json={
        "email": "emailflow@example.com",
        "password": "Password123!",
        "full_name": "Email Flow User"
    })

    with patch.object(EmailService, "send_password_reset_email", return_value=True) as mock_email:
        resp = client.post("/api/auth/forgot-password", json={"email": "emailflow@example.com"})
        assert resp.status_code == 200
        assert mock_email.called
        call_kwargs = mock_email.call_args.kwargs
        assert call_kwargs["to_email"] == "emailflow@example.com"
        assert call_kwargs["user_name"] == "Email Flow User"
        assert "token" in call_kwargs


