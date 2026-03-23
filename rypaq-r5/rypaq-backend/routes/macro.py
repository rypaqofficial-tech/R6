"""Macro indicators and portfolio aggregation endpoints"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import MacroIndicator, Company
from datetime import datetime

router = APIRouter(prefix="/api/macro", tags=["macro"])


@router.get("/live")
async def get_macro_live(session: Session = Depends(get_session)):
    """Get live macro indicators and portfolio-wide risk metrics"""
    try:
        # Get latest macro indicators
        macro = session.exec(
            select(MacroIndicator).order_by(MacroIndicator.timestamp.desc())
        ).first()

        # Default values if no macro data in DB
        gdp_growth = macro.gdp_growth if macro else 5.2
        inflation_rate = macro.inflation_rate if macro else 3.8
        lending_rate = macro.lending_rate if macro else 12.5
        exchange_rate = macro.exchange_rate if macro else 150.5
        timestamp = macro.timestamp.isoformat() if macro else datetime.utcnow().isoformat()

        # Calculate Portfolio-wide metrics (AUM at Risk, Dry Powder Efficiency)
        companies = session.exec(select(Company)).all()
        
        # AUM at Risk: Sum of enterprise_value for any company with probability < 85%
        aum_at_risk = sum((c.enterprise_value or 0) for c in companies if (c.probability_3x_return or 0) < 85)
        
        # Dry Powder Efficiency: 85 - (risk exposure %) → clamped 55–85%
        # Risk exposure % = (AUM at Risk / Total AUM) * 100
        total_aum = sum((c.enterprise_value or 0) for c in companies)
        risk_exposure_pct = (aum_at_risk / total_aum * 100) if total_aum > 0 else 0
        dry_powder_efficiency = max(55, min(85, 85 - risk_exposure_pct))
        
        # Model Alpha: Average alpha score of all companies
        model_alpha = sum((c.alpha_score or 0) for c in companies) / len(companies) if companies else 0.0

        return {
            "gdp_growth": gdp_growth,
            "inflation_rate": inflation_rate,
            "lending_rate": lending_rate,
            "exchange_rate": exchange_rate,
            "timestamp": timestamp,
            "aum_at_risk": aum_at_risk,
            "dry_powder_efficiency": round(dry_powder_efficiency, 2),
            "model_alpha": round(model_alpha, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
