"""
Database Models for Rypaq R1 Backend
Using SQLModel for type-safe ORM
"""

from sqlmodel import SQLModel, Field
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


# ==================== DATABASE MODELS ====================

class User(SQLModel, table=True):
    """User account model"""
    id: Optional[int] = Field(default=None, primary_key=True)
    open_id: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    role: str = Field(default="analyst")  # analyst, admin, investor
    tier: str = Field(default="free")  # free, pro, enterprise
    name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MacroIndicator(SQLModel, table=True):
    """Macro economic indicators"""
    id: Optional[int] = Field(default=None, primary_key=True)
    gdp_growth: float
    inflation_rate: float
    lending_rate: float
    exchange_rate: float
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)


class Company(SQLModel, table=True):
    """Company/Deal information"""
    id: Optional[int] = Field(default=None, primary_key=True)
    external_id: str = Field(unique=True, index=True)
    name: str = Field(index=True)
    sector: str
    revenue: float
    enterprise_value: float
    ebitda: Optional[float] = None
    debt: Optional[float] = None
    status: str = Field(default="healthy")  # healthy, warning, distress
    probability_3x_return: float = Field(default=0.0, nullable=False)
    sector_momentum: float = Field(default=0.0, nullable=False)
    alpha_score: float = Field(default=0.0, nullable=False)
    signals: str = Field(default="[]")  # JSON string
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RiskScore(SQLModel, table=True):
    """Risk predictions for companies"""
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id", index=True)
    risk_score: float
    probability_of_default: float
    covenant_breach_risk: float
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)


class Prediction(SQLModel, table=True):
    """User predictions/analyses"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    company_id: int = Field(foreign_key="company.id", index=True)
    risk_score: float
    predicted_irr: float
    confidence: float
    risk_label: str
    shap_values: str  # JSON string
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class ValuationScenario(SQLModel, table=True):
    """Valuation scenarios for companies"""
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id", index=True)
    exit_year: int
    exit_multiple: float
    revenue_growth: float
    moic: float
    irr: float
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DueDiligenceReport(SQLModel, table=True):
    """Due diligence analysis"""
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id", index=True)
    market_risk: float
    financial_health: float
    operational_efficiency: float
    customer_concentration: float
    macro_sensitivity: float
    data_integrity_score: float
    red_flags: str = Field(default="[]")  # JSON string
    green_flags: str = Field(default="[]")  # JSON string
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Portfolio(SQLModel, table=True):
    """Portfolio model"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    name: str
    total_aum: float = Field(default=0.0)
    total_risk_score: float = Field(default=0.0)
    diversification_score: float = Field(default=0.0)
    companies: str = Field(default="[]")  # JSON string of company IDs
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Alert(SQLModel, table=True):
    """Alerts for users"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    alert_type: str  # critical, warning, info
    title: str
    description: str
    company_id: Optional[int] = Field(foreign_key="company.id", default=None)
    is_read: bool = Field(default=False)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)


class UploadedPDF(SQLModel, table=True):
    """Metadata for uploaded PDF documents"""
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: Optional[int] = Field(default=None, foreign_key="company.id", index=True)
    filename: str
    file_path: str
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    file_size_mb: float


class ExtractedData(SQLModel, table=True):
    """Extracted financial data from uploaded PDFs"""
    id: Optional[int] = Field(default=None, primary_key=True)
    pdf_id: int = Field(foreign_key="uploadedpdf.id", index=True)
    company_id: int = Field(foreign_key="company.id", index=True)
    # Extracted fields (example, will expand based on LLM output)
    company_name: str
    sector: str
    revenue: float
    ebitda: Optional[float] = None
    debt: Optional[float] = None
    enterprise_value: Optional[float] = None
    # Add other relevant extracted fields here
    extracted_at: datetime = Field(default_factory=datetime.utcnow)


class ChronosForecast(SQLModel, table=True):
    """Chronos-2026 model forecasts"""
    id: Optional[int] = Field(default=None, primary_key=True)
    indicator: str = Field(index=True)  # gdp_growth, inflation_rate, etc
    forecast_value: float
    confidence_lower: float
    confidence_upper: float
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    forecast_date: datetime


# ==================== PYDANTIC REQUEST/RESPONSE MODELS ====================

class ValuationCalculateRequest(BaseModel):
    """Request model for valuation calculation"""
    companyId: str
    revenueGrowth: float
    multipleExpansion: float
    debtPaydown: float
    exitYear: int


class MacroIndicatorsResponse(BaseModel):
    """Response model for macro indicators"""
    gdp_growth: float
    inflation_rate: float
    lending_rate: float
    exchange_rate: float
    timestamp: str


class ChronosForecastResponse(BaseModel):
    """Response model for Chronos forecasts"""
    timestamp: str
    forecast_value: float
    confidence_lower: float
    confidence_upper: float
    model: str = "Chronos-2026"


class DealOpportunityResponse(BaseModel):
    """Response model for deal opportunities"""
    id: str
    company_name: str
    sector: str
    probability_3x_return: float
    sector_momentum: float
    revenue: float
    enterprise_value: float
    alpha_score: float
    signals: List[str]


class PortfolioResponse(BaseModel):
    """Response model for portfolios"""
    id: str
    name: str
    total_aum: float
    total_risk_score: float
    diversification_score: float


class UploadedPDFResponse(BaseModel):
    """Response model for uploaded PDF metadata"""
    id: int
    company_id: Optional[int]
    filename: str
    file_path: str
    upload_date: datetime
    file_size_mb: float


class ExtractedDataResponse(BaseModel):
    """Response model for extracted financial data"""
    id: int
    pdf_id: int
    company_id: int
    company_name: str
    sector: str
    revenue: float
    ebitda: Optional[float]
    debt: Optional[float]
    enterprise_value: Optional[float]
    extracted_at: datetime
