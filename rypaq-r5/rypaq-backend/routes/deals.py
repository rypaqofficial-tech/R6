"""Deal sourcing endpoints"""

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from dependencies import GPUser
from demo_data import DEMO_DEALS
from models import Company

router = APIRouter(prefix="/api/deals", tags=["deals"])


@router.get("/opportunities")
async def get_deal_opportunities(user: GPUser, session: Session = Depends(get_session)):
    """Get deal sourcing opportunities with Alpha scores"""
    try:
        if user.is_demo:
            return DEMO_DEALS
        companies = session.exec(select(Company)).all()

        if companies:
            return [
                {
                    "id": c.external_id,
                    "company_name": c.name,
                    "sector": c.sector,
                    "probability_3x_return": c.probability_3x_return,
                    "sector_momentum": c.sector_momentum,
                    "revenue": c.revenue,
                    "enterprise_value": c.enterprise_value,
                    "alpha_score": c.alpha_score,
                    "signals": json.loads(c.signals) if c.signals else []
                }
                for c in companies
            ]

        # NO MOCK DATA - Return empty list if no companies found
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
