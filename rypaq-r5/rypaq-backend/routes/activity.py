"""Activity log (audit trail)."""

import json

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from database import get_session
from dependencies import GPUser
from models import ActivityLog, User

router = APIRouter(prefix="/api/activity", tags=["activity"])


@router.get("")
def list_activity(
    user: GPUser,
    session: Session = Depends(get_session),
    limit: int = Query(100, ge=1, le=500),
):
    """Recent actions across the org (per-user rows; extend later for org-wide)."""
    rows = session.exec(
        select(ActivityLog)
        .where(ActivityLog.user_id == user.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
    ).all()
    out = []
    for r in rows:
        u = session.get(User, r.user_id)
        out.append(
            {
                "id": r.id,
                "user_email": u.email if u else "unknown",
                "action": r.action,
                "entity_type": r.entity_type,
                "entity_id": r.entity_id,
                "details": json.loads(r.details) if r.details else {},
                "created_at": r.created_at.isoformat(),
            }
        )
    return out
