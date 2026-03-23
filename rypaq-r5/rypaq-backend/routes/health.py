"""Health check endpoints"""

from fastapi import APIRouter
from datetime import datetime

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "backend": "python",
        "ai": "PesaRisk Net + Chronos-2026",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/api/health")
async def api_health_check():
    """API health check endpoint"""
    return {
        "status": "ok",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }
