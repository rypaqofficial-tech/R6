"""Synthetic data for demo / LP preview (no real portfolio leakage)."""

from datetime import datetime, timezone

DEMO_MACRO = {
    "gdp_growth": 4.2,
    "inflation_rate": 6.1,
    "lending_rate": 11.5,
    "exchange_rate": 158.2,
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "aum_at_risk": 12_500_000,
    "dry_powder_efficiency": 72.0,
    "model_alpha": 4.8,
}

DEMO_DEALS = [
    {
        "id": "demo_africa_fintech",
        "company_name": "Demo Fintech Co (Sample)",
        "sector": "Financial Services",
        "probability_3x_return": 68.0,
        "sector_momentum": 72.0,
        "revenue": 18_000_000,
        "enterprise_value": 54_000_000,
        "alpha_score": 8.2,
        "signals": ["Sample: strong recurring revenue", "Sample: regulatory watchlist"],
    },
    {
        "id": "demo_agri_processing",
        "company_name": "Demo Agri Processing (Sample)",
        "sector": "Agribusiness",
        "probability_3x_return": 58.0,
        "sector_momentum": 61.0,
        "revenue": 42_000_000,
        "enterprise_value": 95_000_000,
        "alpha_score": 6.5,
        "signals": ["Sample: margin expansion opportunity"],
    },
    {
        "id": "demo_logistics",
        "company_name": "Demo Logistics (Sample)",
        "sector": "Infrastructure",
        "probability_3x_return": 74.0,
        "sector_momentum": 55.0,
        "revenue": 31_000_000,
        "enterprise_value": 78_000_000,
        "alpha_score": 7.1,
        "signals": ["Sample: route density improving"],
    },
]

DEMO_PORTFOLIOS = [
    {
        "id": "demo_portfolio",
        "name": "Sample African PE Portfolio",
        "total_aum": 185_000_000,
        "avg_irr": 16.4,
        "performing": 2,
        "at_risk": 1,
        "holdings": 3,
        "total_risk_score": 4.2,
        "diversification_score": 7.5,
        "companies": [
            {
                "id": "h1",
                "name": "Holding A (Illustrative)",
                "sector": "Financial Services",
                "valuation": 54_000_000,
                "revenue": 18_000_000,
                "ebitda": 5_200_000,
                "debt": 8_000_000,
                "risk_score": 3.8,
                "status": "healthy",
                "probability_3x_return": 68.0,
                "alpha_score": 8.2,
            },
            {
                "id": "h2",
                "name": "Holding B (Illustrative)",
                "sector": "Agribusiness",
                "valuation": 95_000_000,
                "revenue": 42_000_000,
                "ebitda": 9_100_000,
                "debt": 22_000_000,
                "risk_score": 5.1,
                "status": "warning",
                "probability_3x_return": 58.0,
                "alpha_score": 6.5,
            },
            {
                "id": "h3",
                "name": "Holding C (Illustrative)",
                "sector": "Infrastructure",
                "valuation": 36_000_000,
                "revenue": 31_000_000,
                "ebitda": 4_800_000,
                "debt": 11_000_000,
                "risk_score": 3.5,
                "status": "healthy",
                "probability_3x_return": 74.0,
                "alpha_score": 7.1,
            },
        ],
    }
]

DEMO_ALERTS = [
    {
        "id": "demo_alert_1",
        "type": "info",
        "title": "Sample alert",
        "description": "This is illustrative activity — not tied to live deals.",
        "company_id": None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
]

DEMO_TOP_TARGETS = [
    {"id": 1, "name": "Demo Fintech Co (Sample)", "sector": "Financial Services", "alpha": 8.2, "probability": 68.0},
    {"id": 2, "name": "Demo Logistics (Sample)", "sector": "Infrastructure", "alpha": 7.1, "probability": 74.0},
]

DEMO_DILIGENCE = {
    "company_id": "demo_africa_fintech",
    "company_name": "Demo Fintech Co (Sample)",
    "market_risk": 5.0,
    "financial_health": 6.5,
    "operational_efficiency": 7.0,
    "customer_concentration": 4.5,
    "macro_sensitivity": 5.5,
    "data_integrity_score": 7.5,
    "red_flags": ["Sample: customer concentration in two clients"],
    "green_flags": ["Sample: diversified revenue streams"],
}

DEMO_UPLOADS: list = []

DEMO_LP_SUMMARY = {
    "fund_name": "Sample Fund I (Illustrative)",
    "reported_nav": 118_500_000,
    "distributed_to_date": 22_000_000,
    "unrealized_value": 96_500_000,
    "tvpi": 1.42,
    "dpi": 0.28,
    "quarter": "Q4 2025",
    "note": "Figures are synthetic for LP portal preview.",
}
