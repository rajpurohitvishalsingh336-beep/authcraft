from typing import Optional
from sqlalchemy.orm import Session

from app.models.auth_event import AuthenticationEvent


class AuditService:
    @staticmethod
    def record_event(
        db: Session,
        project_id: str,
        event_type: str,
        status: str,
        email_attempted: Optional[str] = None,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        failure_reason: Optional[str] = None,
    ) -> AuthenticationEvent:
        """
        Record a security or authentication audit event.
        Strictly sanitizes inputs and never logs passwords, raw tokens, or secrets.
        """
        event = AuthenticationEvent(
            project_id=project_id,
            user_id=user_id,
            event_type=event_type,
            status=status,
            email_attempted=email_attempted.strip().lower() if email_attempted else None,
            ip_address=ip_address[:45] if ip_address else None,
            user_agent=user_agent[:255] if user_agent else None,
            failure_reason=failure_reason[:255] if failure_reason else None,
        )
        db.add(event)
        try:
            db.commit()
            db.refresh(event)
        except Exception:
            db.rollback()
        return event
