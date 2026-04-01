"""Due diligence endpoints"""

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from dependencies import GPUser
from demo_data import DEMO_DEALS, DEMO_DILIGENCE
from models import Company, DueDiligenceReport

router = APIRouter(prefix="/api/diligence", tags=["diligence"])


@router.get("/report/{company_id}")
async def get_diligence_report(
    company_id: str,
    user: GPUser,
    session: Session = Depends(get_session),
):
    """Get due diligence report with risk analysis"""
    try:
        if user.is_demo:
            name = next((d["company_name"] for d in DEMO_DEALS if d["id"] == company_id), DEMO_DILIGENCE["company_name"])
            return {**DEMO_DILIGENCE, "company_id": company_id, "company_name": name}
        company = session.exec(
            select(Company).where(Company.external_id == company_id)
        ).first()

        if company:
            report = session.exec(
                select(DueDiligenceReport).where(DueDiligenceReport.company_id == company.id)
            ).first()

            if report:
                return {
                    "company_id": company_id,
                    "company_name": company.name,
                    "market_risk": report.market_risk,
                    "financial_health": report.financial_health,
                    "operational_efficiency": report.operational_efficiency,
                    "customer_concentration": report.customer_concentration,
                    "macro_sensitivity": report.macro_sensitivity,
                    "data_integrity_score": report.data_integrity_score,
                    "red_flags": json.loads(report.red_flags) if report.red_flags else [],
                    "green_flags": json.loads(report.green_flags) if report.green_flags else []
                }
        
        # NO MOCK DATA - Return 404 if no report found
        raise HTTPException(status_code=404, detail="Due diligence report not found for this company")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
