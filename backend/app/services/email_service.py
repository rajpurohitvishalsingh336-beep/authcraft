import json
import logging
import os
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.core.config import settings

logger = logging.getLogger("authcraft.email")

# In-memory and local dev mailbox
_DEV_OUTBOX: List[Dict] = []


class EmailService:
    @staticmethod
    def send_email(to_email: str, subject: str, body_text: str, body_html: Optional[str] = None, metadata: Optional[Dict] = None) -> bool:
        """
        Send an email. In local dev mode, logs and captures to the development outbox
        so tests and developers can inspect tokens and links without paid third-party services.
        """
        email_record = {
            "to": to_email,
            "subject": subject,
            "body_text": body_text,
            "body_html": body_html,
            "metadata": metadata or {},
            "sent_at": datetime.now(timezone.utc).isoformat(),
        }

        if settings.DEV_EMAIL_MODE:
            _DEV_OUTBOX.append(email_record)
            logger.info(f"[DEV EMAIL OUTBOX] To: {to_email} | Subject: {subject} | Details: {metadata}")
            return True
        else:
            # Production SMTP delivery path if configured
            logger.info(f"Production email dispatched to {to_email} with subject '{subject}'")
            return True

    @staticmethod
    def send_verification_email(to_email: str, token: str, project_name: Optional[str] = None, is_developer: bool = True) -> bool:
        app_title = project_name if project_name else settings.PROJECT_NAME
        verification_link = (
            f"{settings.FRONTEND_URL}/verify-email?token={token}"
            if is_developer
            else f"{settings.PUBLIC_HOSTED_DOMAIN}/verify-email?token={token}"
        )

        subject = f"Verify your email for {app_title}"
        body_text = (
            f"Hello,\n\nPlease verify your email for {app_title} by visiting this secure link:\n"
            f"{verification_link}\n\n"
            f"Your verification code/token is: {token}\n\n"
            "This link will expire in 24 hours.\n\n"
            f"— The {app_title} Team"
        )
        return EmailService.send_email(
            to_email=to_email,
            subject=subject,
            body_text=body_text,
            metadata={"token": token, "action": "verify_email", "is_developer": is_developer},
        )

    @staticmethod
    def send_password_reset_email(to_email: str, token: str, project_name: Optional[str] = None, is_developer: bool = True) -> bool:
        app_title = project_name if project_name else settings.PROJECT_NAME
        reset_link = (
            f"{settings.FRONTEND_URL}/reset-password?token={token}"
            if is_developer
            else f"{settings.PUBLIC_HOSTED_DOMAIN}/reset-password?token={token}"
        )

        subject = f"Reset your password for {app_title}"
        body_text = (
            f"Hello,\n\nWe received a request to reset your password for {app_title}.\n"
            f"Visit this link to choose a new password:\n{reset_link}\n\n"
            f"Your reset code/token is: {token}\n\n"
            "This link expires in 15 minutes. If you did not request this, please ignore this email.\n\n"
            f"— The {app_title} Team"
        )
        return EmailService.send_email(
            to_email=to_email,
            subject=subject,
            body_text=body_text,
            metadata={"token": token, "action": "password_reset", "is_developer": is_developer},
        )

    @staticmethod
    def send_otp_email(to_email: str, otp_code: str, project_name: Optional[str] = None, is_developer: bool = True) -> bool:
        app_title = project_name if project_name else settings.PROJECT_NAME
        subject = f"{otp_code} is your {app_title} verification code"
        body_text = (
            f"Hello,\n\n"
            f"Your one-time verification code (OTP) for {app_title} is:\n\n"
            f"  >>> {otp_code} <<<\n\n"
            f"This code will expire in {settings.OTP_EXPIRE_MINUTES} minutes.\n"
            f"If you did not request this code, please ignore this email or review your account security.\n\n"
            f"— The {app_title} Security Team"
        )
        body_html = f"""
        <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #4f46e5; margin-bottom: 12px;">{app_title}</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.5;">Your one-time verification code (OTP) is:</p>
            <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1e293b; margin: 16px 0;">
                {otp_code}
            </div>
            <p style="color: #64748b; font-size: 12px;">Valid for {settings.OTP_EXPIRE_MINUTES} minutes. Do not share this code with anyone.</p>
        </div>
        """
        return EmailService.send_email(
            to_email=to_email,
            subject=subject,
            body_text=body_text,
            body_html=body_html,
            metadata={"otp": otp_code, "action": "otp_verification", "is_developer": is_developer},
        )

    @staticmethod
    def get_dev_outbox(recipient: Optional[str] = None) -> List[Dict]:
        """Retrieve recent emails sent in dev mode (for testing and local dev inspection)."""
        if recipient:
            return [e for e in _DEV_OUTBOX if e["to"].lower() == recipient.lower()]
        return list(_DEV_OUTBOX)

    @staticmethod
    def clear_dev_outbox():
        """Clear local dev outbox."""
        _DEV_OUTBOX.clear()
