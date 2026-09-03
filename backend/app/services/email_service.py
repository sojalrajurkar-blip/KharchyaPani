import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Dict, Any
import httpx

from app.core.config import settings

logger = logging.getLogger("kharchyapani.email")

class EmailService:
    """
    Email delivery service supporting:
    1. Local / Dev: SMTP (e.g., Mailpit, Mailhog, Gmail, or local SMTP server)
    2. Production: Resend API (HTTP-based delivery with high deliverability)
    """

    @classmethod
    def send_email(
        cls,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Dispatches email using the configured provider (SMTP or Resend).
        Returns True on success, False on failure.
        """
        provider = settings.get_effective_email_provider()
        logger.info(f"Dispatching email to {to_email} using provider='{provider}'")

        if provider == "resend":
            return cls._send_via_resend(to_email, subject, html_content, text_content)
        else:
            return cls._send_via_smtp(to_email, subject, html_content, text_content)

    @classmethod
    def _send_via_resend(
        cls,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send email via Resend REST API."""
        if not settings.RESEND_API_KEY:
            logger.warning("Resend API key not configured. Falling back to local SMTP.")
            return cls._send_via_smtp(to_email, subject, html_content, text_content)

        payload: Dict[str, Any] = {
            "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        if text_content:
            payload["text"] = text_content

        headers = {
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json"
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.post(
                    "https://api.resend.com/emails",
                    json=payload,
                    headers=headers
                )
                if response.status_code in (200, 201):
                    logger.info(f"Email successfully dispatched via Resend to {to_email} (ID: {response.json().get('id')})")
                    return True
                else:
                    logger.error(f"Resend API error [{response.status_code}]: {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Failed to send email via Resend to {to_email}: {e}", exc_info=True)
            return False

    @classmethod
    def _send_via_smtp(
        cls,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send email via standard SMTP server."""
        from_email = settings.SMTP_USER if (settings.SMTP_USER and "gmail.com" in settings.SMTP_HOST.lower()) else (settings.EMAIL_FROM or settings.SMTP_USER)
        from_header = f"{settings.EMAIL_FROM_NAME} <{from_email}>" if settings.EMAIL_FROM_NAME else from_email

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_header
        msg["To"] = to_email

        if text_content:
            msg.attach(MIMEText(text_content, "plain", "utf-8"))
        if html_content:
            msg.attach(MIMEText(html_content, "html", "utf-8"))

        try:
            if settings.SMTP_SSL:
                server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10.0)
            else:
                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10.0)

            with server:
                if settings.SMTP_TLS and not settings.SMTP_SSL:
                    server.starttls()

                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

                server.sendmail(from_email, [to_email], msg.as_string())
                logger.info(f"Email successfully dispatched via SMTP ({settings.SMTP_HOST}:{settings.SMTP_PORT}) from {from_email} to {to_email}")
                return True
        except ConnectionRefusedError:
            logger.warning(
                f"SMTP connection refused at {settings.SMTP_HOST}:{settings.SMTP_PORT}. "
                f"For local dev testing, make sure your SMTP server (e.g. Mailpit/Mailhog) is running. "
                f"Email subject: '{subject}' to {to_email}"
            )
            return False
        except Exception as e:
            logger.error(f"Failed to send email via SMTP to {to_email}: {e}", exc_info=True)
            return False

    @classmethod
    def resolve_frontend_url(cls, client_origin: Optional[str] = None) -> str:
        """
        Dynamically determine the frontend URL for email links.
        Ensures localhost is never sent in production when a production origin is available.
        """
        is_prod = settings.APP_ENV.lower() == "production"

        # 1. Direct client origin (from request payload or Origin/Referer header)
        if client_origin and client_origin != "null":
            cleaned = client_origin.strip().rstrip('/')
            if not is_prod or ("localhost" not in cleaned and "127.0.0.1" not in cleaned):
                return cleaned

        # 2. Configured FRONTEND_URL
        configured = (settings.FRONTEND_URL or "").strip().rstrip('/')
        if not is_prod and configured:
            return configured

        if is_prod and configured and "localhost" not in configured and "127.0.0.1" not in configured:
            return configured

        # 3. If in production and FRONTEND_URL is still localhost, look for non-localhost origin in CORS_ORIGINS
        cors_list = (
            settings.CORS_ORIGINS
            if isinstance(settings.CORS_ORIGINS, list)
            else [o.strip() for o in str(settings.CORS_ORIGINS).split(",") if o.strip()]
        )
        for origin in cors_list:
            cleaned = origin.strip().rstrip('/')
            if cleaned and "localhost" not in cleaned and "127.0.0.1" not in cleaned:
                return cleaned

        # 4. Fallback to configured or default
        return configured or "http://localhost:3000"

    @classmethod
    def send_password_reset_email(
        cls,
        to_email: str,
        token: str,
        user_name: Optional[str] = None,
        client_origin: Optional[str] = None
    ) -> bool:
        """
        Build and send a branded Password Reset email containing the secure token link.
        """
        base_url = cls.resolve_frontend_url(client_origin)
        reset_link = f"{base_url}/reset-password?token={token}"
        greeting = f"Hello {user_name}," if user_name else "Hello,"

        subject = "KharchyaPani — Password Reset Instructions"

        text_content = f"""
{greeting}

We received a request to reset the password for your KharchyaPani account.

To reset your password, visit the link below:
{reset_link}

This link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email.

— KharchyaPani Security Team
"""

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f19; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #1e293b; background: linear-gradient(180deg, rgba(14,165,233,0.1) 0%, rgba(15,23,42,0) 100%);">
              <div style="display: inline-block; padding: 12px; border-radius: 14px; background: rgba(14,165,233,0.15); border: 1px solid rgba(14,165,233,0.3); margin-bottom: 12px;">
                <span style="font-size: 24px; color: #38bdf8; font-weight: 700;">🪙 KharchyaPani</span>
              </div>
              <h1 style="margin: 8px 0 0; font-size: 22px; font-weight: 700; color: #ffffff;">Password Reset Request</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #cbd5e1;">{greeting}</p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #94a3b8;">
                We received a request to reset your password for your <strong>KharchyaPani</strong> account. Click the button below to choose a new password:
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="{reset_link}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 12px; box-shadow: 0 8px 20px rgba(14,165,233,0.3); border: 1px solid rgba(255,255,255,0.15);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #0b0f19; border: 1px solid #1e293b; border-radius: 10px; padding: 16px; margin: 24px 0 0;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; font-weight: 600;">Button not working? Copy and paste this URL into your browser:</p>
                <p style="margin: 0; font-size: 12px; color: #38bdf8; word-break: break-all;">{reset_link}</p>
              </div>

              <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                ⚠️ <em>This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</em>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0b0f19; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #475569;">
                &copy; {settings.EMAIL_FROM_NAME} &bull; Personal Expense & Budget Management
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
        return cls.send_email(to_email, subject, html_content, text_content)

    @classmethod
    def send_welcome_email(
        cls,
        to_email: str,
        user_name: Optional[str] = None,
        client_origin: Optional[str] = None
    ) -> bool:
        """
        Build and send a branded Welcome email to newly registered users.
        """
        app_url = cls.resolve_frontend_url(client_origin)
        greeting = f"Hello {user_name}," if user_name else "Hello,"

        subject = f"Welcome to {settings.EMAIL_FROM_NAME}! 🚀 Track Smart, Save More"

        text_content = f"""
{greeting}

Welcome to {settings.EMAIL_FROM_NAME}! Your account has been successfully created.

With {settings.EMAIL_FROM_NAME}, you can:
• Effortlessly log and categorize daily expenses
• Set daily and monthly budget limits with real-time tracking
• Gain instant visual financial clarity with interactive analytics

Open your dashboard:
{app_url}

Thank you for choosing {settings.EMAIL_FROM_NAME}!

— The {settings.EMAIL_FROM_NAME} Team
"""

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to {settings.EMAIL_FROM_NAME}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f19; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #1e293b; background: linear-gradient(180deg, rgba(14,165,233,0.1) 0%, rgba(15,23,42,0) 100%);">
              <div style="display: inline-block; padding: 12px; border-radius: 14px; background: rgba(14,165,233,0.15); border: 1px solid rgba(14,165,233,0.3); margin-bottom: 12px;">
                <span style="font-size: 24px; color: #38bdf8; font-weight: 700;">🪙 KharchyaPani</span>
              </div>
              <h1 style="margin: 8px 0 0; font-size: 22px; font-weight: 700; color: #ffffff;">Welcome Aboard! 🚀</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #cbd5e1;">{greeting}</p>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #94a3b8;">
                Your account is ready! <strong>{settings.EMAIL_FROM_NAME}</strong> makes tracking your personal expenses and managing monthly budgets seamless, fast, and secure.
              </p>

              <!-- Feature Highlights -->
              <div style="background-color: #0b0f19; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <div style="margin-bottom: 12px; font-size: 14px; color: #cbd5e1;">
                  📊 <strong style="color: #38bdf8;">Visual Dashboard</strong> — Live analytics & spending breakdowns.
                </div>
                <div style="margin-bottom: 12px; font-size: 14px; color: #cbd5e1;">
                  🎯 <strong style="color: #38bdf8;">Budget Limits</strong> — Set and monitor daily & monthly caps.
                </div>
                <div style="font-size: 14px; color: #cbd5e1;">
                  🏷️ <strong style="color: #38bdf8;">Custom Categories</strong> — Organize your finances your way.
                </div>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0 16px;">
                <tr>
                  <td align="center">
                    <a href="{app_url}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 12px; box-shadow: 0 8px 20px rgba(14,165,233,0.3); border: 1px solid rgba(255,255,255,0.15);">
                      Open My Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0b0f19; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #475569;">
                &copy; {settings.EMAIL_FROM_NAME} &bull; Personal Expense & Budget Management
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
        return cls.send_email(to_email, subject, html_content, text_content)

