"""Deal pipeline kanban (per user)."""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from activity_service import log_activity
from database import get_session
from dependencies import GPUser
from models import PipelineDeal

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])

STAGES = ("sourcing", "diligence", "ic", "closing", "won", "lost")


class PipelineCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    stage: str = "sourcing"
    company_id: Optional[int] = None


class PipelinePatch(BaseModel):
    stage: Optional[str] = None
    sort_order: Optional[int] = None
    title: Optional[str] = None


def _validate_stage(stage: str) -> None:
    if stage not in STAGES:
        raise HTTPException(400, detail=f"stage must be one of {STAGES}")


@router.get("")
def list_pipeline(user: GPUser, session: Session = Depends(get_session)):
    rows = session.exec(
        select(PipelineDeal)
        .where(PipelineDeal.user_id == user.id)
        .order_by(PipelineDeal.stage, PipelineDeal.sort_order, PipelineDeal.id)
    ).all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "stage": r.stage,
            "company_id": r.company_id,
            "sort_order": r.sort_order,
            "updated_at": r.updated_at.isoformat(),
        }
        for r in rows
    ]


@router.post("")
def create_card(body: PipelineCreate, user: GPUser, session: Session = Depends(get_session)):
    _validate_stage(body.stage)
    row = PipelineDeal(
        user_id=user.id,
        title=body.title.strip(),
        stage=body.stage,
        company_id=body.company_id,
        sort_order=0,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    log_activity(session, user.id, "pipeline_create", "pipeline", str(row.id), {"title": row.title})
    return {"id": row.id}


@router.patch("/{deal_id}")
def patch_card(
    deal_id: int,
    body: PipelinePatch,
    user: GPUser,
    session: Session = Depends(get_session),
):
    row = session.get(PipelineDeal, deal_id)
    if not row or row.user_id != user.id:
        raise HTTPException(404, detail="Not found")
    if body.stage is not None:
        _validate_stage(body.stage)
        row.stage = body.stage
    if body.sort_order is not None:
        row.sort_order = body.sort_order
    if body.title is not None:
        row.title = body.title.strip()
    row.updated_at = datetime.now(timezone.utc)
    session.add(row)
    session.commit()
    log_activity(session, user.id, "pipeline_update", "pipeline", str(deal_id), body.model_dump(exclude_none=True))
    return {"ok": True}


@router.delete("/{deal_id}")
def delete_card(deal_id: int, user: GPUser, session: Session = Depends(get_session)):
    row = session.get(PipelineDeal, deal_id)
    if not row or row.user_id != user.id:
        raise HTTPException(404, detail="Not found")
    session.delete(row)
    session.commit()
    log_activity(session, user.id, "pipeline_delete", "pipeline", str(deal_id))
    return {"ok": True}
