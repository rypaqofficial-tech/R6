"""Quarterly portfolio summary and waterfall calculator API."""

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from database import get_session
from dependencies import GPUser
from demo_data import DEMO_PORTFOLIOS
from models import Company

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/quarterly")
def quarterly_report(user: GPUser, session: Session = Depends(get_session)):
    """Aggregate portfolio metrics for the current quarter snapshot."""
    now = datetime.now(timezone.utc)
    q = (now.month - 1) // 3 + 1
    period = f"{now.year}-Q{q}"
    if user.is_demo:
        p = DEMO_PORTFOLIOS[0]
        return {
            "period": period,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "is_demo": True,
            "portfolio_name": p["name"],
            "total_aum": p["total_aum"],
            "avg_irr": p["avg_irr"],
            "holdings": p["holdings"],
            "performing": p["performing"],
            "at_risk": p["at_risk"],
            "narrative": "Automated quarterly snapshot (sample data in demo mode).",
        }
    companies = session.exec(select(Company)).all()
    total_aum = sum((c.enterprise_value or 0) for c in companies)
    avg_alpha = sum((c.alpha_score or 0) for c in companies) / len(companies) if companies else 0.0
    performing = len([c for c in companies if (c.probability_3x_return or 0) >= 70])
    at_risk = len([c for c in companies if (c.probability_3x_return or 0) < 70])
    return {
        "period": period,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "is_demo": False,
        "portfolio_name": "Consolidated",
        "total_aum": total_aum,
        "avg_irr": round(avg_alpha * 2, 2),
        "holdings": len(companies),
        "performing": performing,
        "at_risk": at_risk,
        "narrative": "Automated quarterly snapshot from live company records.",
    }


class WaterfallTier(BaseModel):
    name: str
    committed: float = Field(ge=0)
    catchup_rate: float = Field(default=0, ge=0, le=1)
    carry_rate: float = Field(default=0, ge=0, le=1)


class WaterfallRequest(BaseModel):
    total_distribution: float = Field(gt=0)
    tiers: List[WaterfallTier]


@router.post("/waterfall")
def waterfall_calc(body: WaterfallRequest, user: GPUser):
    """
    Simple sequential waterfall: return capital, then profit splits by tier.
    Illustrative only — not legal/tax advice.
    """
    remaining = body.total_distribution
    steps = []
    for t in body.tiers:
        paid = min(remaining, t.committed) if t.committed > 0 else 0
        if t.committed > 0:
            remaining -= paid
            steps.append({"tier": t.name, "type": "return_of_capital", "amount": round(paid, 2)})
    profit_pool = max(0.0, remaining)
    carry = 0.0
    lp_profit = profit_pool
    for t in body.tiers:
        if t.carry_rate > 0 and profit_pool > 0:
            c = profit_pool * t.carry_rate
            carry += c
            lp_profit -= c
            steps.append({"tier": t.name, "type": "carry", "amount": round(c, 2)})
    steps.append({"tier": "LP", "type": "residual_to_lp", "amount": round(max(0, lp_profit), 2)})
    return {
        "total_distribution": body.total_distribution,
        "steps": steps,
        "total_carry": round(carry, 2),
        "note": "Simplified model for planning; validate with fund counsel.",
    }
