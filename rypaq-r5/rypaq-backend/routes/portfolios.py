"""Portfolio endpoints"""

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from dependencies import GPUser
from demo_data import DEMO_PORTFOLIOS, DEMO_TOP_TARGETS
from models import Portfolio, Company

router = APIRouter(prefix="/api", tags=["portfolios"])


@router.get("/portfolios")
async def get_portfolios(user: GPUser, session: Session = Depends(get_session)):
    """Get all portfolios with summary metrics"""
    try:
        if user.is_demo:
            return DEMO_PORTFOLIOS
        portfolios = session.exec(select(Portfolio)).all()

        # If no portfolios exist, create a virtual one containing all companies
        if not portfolios:
            all_companies = session.exec(select(Company)).all()
            if not all_companies:
                return []
            
            companies_data = []
            for company in all_companies:
                # Derive risk_score from probability: high probability = low risk
                _prob = company.probability_3x_return or 50.0
                _derived_risk = round(10.0 - (_prob / 10.0), 1)  # 0-10 scale, lower prob = higher risk
                companies_data.append({
                    "id": str(company.id),
                    "name": company.name,
                    "sector": company.sector,
                    "valuation": company.enterprise_value,
                    "revenue": company.revenue,
                    "ebitda": company.ebitda or 0,
                    "debt": company.debt or 0,
                    "risk_score": _derived_risk,
                    "status": company.status,
                    "probability_3x_return": company.probability_3x_return,
                    "alpha_score": company.alpha_score
                })
            
            total_aum = sum((c["valuation"] or 0) for c in companies_data)
            avg_irr = sum((c["alpha_score"] or 0) * 2 for c in companies_data) / len(companies_data) if companies_data else 0.0
            performing = len([c for c in companies_data if (c["probability_3x_return"] or 0) >= 70])
            at_risk = len([c for c in companies_data if (c["probability_3x_return"] or 0) < 70])

            # Diversification score: based on number of unique sectors (0-10)
            unique_sectors = len(set(c["sector"] for c in companies_data))
            _diversification = min(10.0, round(unique_sectors * 2.0, 1))
            # Total risk score: average of derived risk scores
            _total_risk = round(sum(c["risk_score"] for c in companies_data) / len(companies_data), 1) if companies_data else 5.0
            
            return [{
                "id": "default",
                "name": "Main Portfolio",
                "total_aum": total_aum,
                "avg_irr": round(avg_irr, 2),
                "performing": performing,
                "at_risk": at_risk,
                "holdings": len(companies_data),
                "companies": companies_data,
                "total_risk_score": _total_risk,
                "diversification_score": _diversification
            }]

        result = []
        for p in portfolios:
            company_ids = json.loads(p.companies) if p.companies else []
            companies = []
            for cid in company_ids:
                company = session.exec(
                    select(Company).where(Company.id == cid)
                ).first()
                if company:
                    _prob2 = company.probability_3x_return or 50.0
                    _derived_risk2 = round(10.0 - (_prob2 / 10.0), 1)
                    companies.append({
                        "id": str(company.id),
                        "name": company.name,
                        "sector": company.sector,
                        "valuation": company.enterprise_value,
                        "revenue": company.revenue,
                        "ebitda": company.ebitda or 0,
                        "debt": company.debt or 0,
                        "risk_score": _derived_risk2,
                        "status": company.status,
                        "probability_3x_return": company.probability_3x_return,
                        "alpha_score": company.alpha_score
                    })

            # Calculate summary metrics for the dashboard
            total_aum = sum((c["valuation"] or 0) for c in companies)
            avg_irr = sum((c["alpha_score"] or 0) * 2 for c in companies) / len(companies) if companies else 0.0
            performing = len([c for c in companies if (c["probability_3x_return"] or 0) >= 70])
            at_risk = len([c for c in companies if (c["probability_3x_return"] or 0) < 70])

            result.append({
                "id": str(p.id),
                "name": p.name,
                "total_aum": total_aum,
                "avg_irr": round(avg_irr, 2),
                "performing": performing,
                "at_risk": at_risk,
                "holdings": len(companies),
                "companies": companies,
                "total_risk_score": p.total_risk_score,
                "diversification_score": p.diversification_score
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# ====================== NEW ENDPOINT FOR TOP SOURCING TARGETS ======================
@router.get("/portfolios/top-sourcing-targets")
async def get_top_sourcing_targets(user: GPUser, session: Session = Depends(get_session)):
    """Return top 3 highest-alpha companies for the dashboard"""
    try:
        if user.is_demo:
            return DEMO_TOP_TARGETS
        companies = session.exec(
            select(Company)
            .order_by(Company.probability_3x_return.desc())
            .limit(3)
        ).all()

        return [
            {
                "id": c.id,
                "name": c.name,
                "sector": c.sector,
                "alpha": round(c.alpha_score, 3),
                "probability": round(c.probability_3x_return, 1),
            }
            for c in companies
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ================================================================================
