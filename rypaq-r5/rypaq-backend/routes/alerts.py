"""Alerts endpoints"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from datetime import datetime, timedelta
from database import get_session
from models import Alert

router = APIRouter(prefix="/api", tags=["alerts"])


@router.get("/alerts")
async def get_alerts(
    severity: str = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    session: Session = Depends(get_session)
):
    """Get alerts"""
    try:
        query = select(Alert)
        if severity:
            query = query.where(Alert.alert_type == severity)

        alerts = session.exec(
            query.offset(skip).limit(limit)
            .order_by(Alert.timestamp.desc())
        ).all()

        if alerts:
            return [
                {
                    "id": str(a.id),
                    "type": a.alert_type,
                    "title": a.title,
                    "description": a.description,
                    "company_id": str(a.company_id) if a.company_id else None,
                    "timestamp": a.timestamp.isoformat()
                }
                for a in alerts
            ]

        # NO MOCK DATA - Return empty list if no alerts found
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
