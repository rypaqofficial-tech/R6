"""Append-only activity log rows."""

import json
from typing import Any, Optional

from sqlmodel import Session

from models import ActivityLog


def log_activity(
    session: Session,
    user_id: int,
    action: str,
    entity_type: str = "general",
    entity_id: Optional[str] = None,
    details: Optional[dict[str, Any]] = None,
) -> None:
    row = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=json.dumps(details or {}),
    )
    session.add(row)
    session.commit()
