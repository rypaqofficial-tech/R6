"""
Rypaq R1 - Predictive AI Platform Backend
FastAPI + SQLModel + Chronos-2026 + PesaRisk Net
"""

import os
from dotenv import load_dotenv  # Add this line

# Load the .env file BEFORE importing routes
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import database setup
from database import create_db_and_tables, engine
from sqlmodel import Session
from seed_users import ensure_seed_users

# Import route modules
from routes import (
    activity,
    alerts,
    auth,
    deals,
    diligence,
    email_connect,
    health,
    lp_portal,
    macro,
    pipeline,
    portfolios,
    reports,
    uploads,
)

# Create FastAPI app
app = FastAPI(
    title="Rypaq R1 - Predictive AI Platform",
    description="Backend API for Rypaq R1 with Chronos-2026 forecasting and PesaRisk neural network",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

_cors = os.getenv("FRONTEND_ORIGINS", "").strip()
_allow_origins = (
    [o.strip() for o in _cors.split(",") if o.strip()]
    if _cors
    else [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== STARTUP EVENT ====================

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    print("🚀 Starting Rypaq R1 Backend...")
    create_db_and_tables()
    with Session(engine) as session:
        ensure_seed_users(session)
    print("✅ Backend initialized successfully")


# ==================== REGISTER ROUTES ====================

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(macro.router)
app.include_router(deals.router)
app.include_router(diligence.router)
app.include_router(portfolios.router)
app.include_router(alerts.router)
app.include_router(uploads.router)
app.include_router(activity.router)
app.include_router(pipeline.router)
app.include_router(reports.router)
app.include_router(lp_portal.router)
app.include_router(email_connect.router)


# ==================== MAIN ====================

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    print(f"\n🚀 Starting Rypaq R1 Backend on port {port}")
    print(f"📚 API Documentation: http://localhost:{port}/docs\n")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )
