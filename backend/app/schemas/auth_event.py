from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AuthEventResponse(BaseModel):
    id: str
    project_id: str
    user_id: Optional[str] = None
    event_type: str
    status: str
    email_attempted: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    failure_reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
