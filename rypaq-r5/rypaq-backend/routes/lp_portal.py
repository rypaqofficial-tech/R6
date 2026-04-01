"""Limited partner read-only summary."""

from fastapi import APIRouter

from demo_data import DEMO_LP_SUMMARY
from dependencies import LPUser

router = APIRouter(prefix="/api/lp", tags=["lp"])


@router.get("/summary")
def lp_summary(user: LPUser):
    """Synthetic LP dashboard payload (extend with real fund accounting later)."""
    return {**DEMO_LP_SUMMARY, "email": user.email}
