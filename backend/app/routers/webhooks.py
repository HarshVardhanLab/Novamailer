from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app import deps
from app.core.database import get_db
from app.models.webhook import Webhook
from app.models.user import User
from app.services.webhook_service import WEBHOOK_EVENTS

router = APIRouter()


class WebhookCreate(BaseModel):
    name: str
    url: str
    events: List[str]
    secret: Optional[str] = None
    active: bool = True


@router.get("/events")
async def list_events():
    return {"events": WEBHOOK_EVENTS}


@router.get("/", response_model=List[dict])
async def list_webhooks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(select(Webhook).filter(Webhook.user_id == current_user.id))
    return [
        {
            "id": w.id,
            "name": w.name,
            "url": w.url,
            "events": w.events,
            "active": w.active,
            "created_at": w.created_at,
        }
        for w in result.scalars().all()
    ]


@router.post("/")
async def create_webhook(
    body: WebhookCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    invalid = [e for e in body.events if e not in WEBHOOK_EVENTS]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid events: {invalid}")

    wh = Webhook(**body.dict(), user_id=current_user.id)
    db.add(wh)
    await db.commit()
    await db.refresh(wh)
    return {"id": wh.id, "name": wh.name, "url": wh.url, "events": wh.events, "active": wh.active}


@router.put("/{webhook_id}")
async def update_webhook(
    webhook_id: int,
    body: WebhookCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(Webhook).filter(Webhook.id == webhook_id, Webhook.user_id == current_user.id)
    )
    wh = result.scalars().first()
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook not found")

    for k, v in body.dict().items():
        setattr(wh, k, v)
    await db.commit()
    return {"message": "Webhook updated"}


@router.delete("/{webhook_id}")
async def delete_webhook(
    webhook_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(Webhook).filter(Webhook.id == webhook_id, Webhook.user_id == current_user.id)
    )
    wh = result.scalars().first()
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook not found")
    await db.delete(wh)
    await db.commit()
    return {"message": "Webhook deleted"}
