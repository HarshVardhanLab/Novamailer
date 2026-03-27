from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import List

from app import deps
from app.core.database import get_db
from app.models.unsubscribe import Unsubscribe
from app.models.email_tracking import EmailTracking
from app.models.user import User

router = APIRouter()


@router.get("/{tracking_id}", response_class=HTMLResponse)
async def unsubscribe_via_link(tracking_id: str, db: AsyncSession = Depends(get_db)):
    """Handle unsubscribe from email link (no auth required)."""
    result = await db.execute(
        select(EmailTracking).filter(EmailTracking.tracking_id == tracking_id)
    )
    record = result.scalars().first()
    if not record:
        return HTMLResponse("<h2>Invalid unsubscribe link.</h2>", status_code=404)

    # Get recipient email
    from app.models.recipient import Recipient
    rec_result = await db.execute(
        select(Recipient).filter(Recipient.id == record.recipient_id)
    )
    recipient = rec_result.scalars().first()
    if not recipient:
        return HTMLResponse("<h2>Recipient not found.</h2>", status_code=404)

    # Get campaign owner
    from app.models.campaign import Campaign
    camp_result = await db.execute(
        select(Campaign).filter(Campaign.id == record.campaign_id)
    )
    campaign = camp_result.scalars().first()

    # Check if already unsubscribed
    existing = await db.execute(
        select(Unsubscribe).filter(
            Unsubscribe.email == recipient.email,
            Unsubscribe.user_id == campaign.user_id,
        )
    )
    if not existing.scalars().first():
        db.add(Unsubscribe(
            email=recipient.email,
            user_id=campaign.user_id,
            campaign_id=record.campaign_id,
        ))
        await db.commit()

    return HTMLResponse(
        f"""<html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2>You have been unsubscribed</h2>
        <p>{recipient.email} has been removed from future emails.</p>
        </body></html>"""
    )


# ── Authenticated management ──────────────────────────────────────────────────

class UnsubscribeAdd(BaseModel):
    email: EmailStr


@router.get("/list", response_model=List[dict])
async def list_unsubscribes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(Unsubscribe).filter(Unsubscribe.user_id == current_user.id)
    )
    return [
        {"id": u.id, "email": u.email, "unsubscribed_at": u.unsubscribed_at}
        for u in result.scalars().all()
    ]


@router.post("/add")
async def add_unsubscribe(
    body: UnsubscribeAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    existing = await db.execute(
        select(Unsubscribe).filter(
            Unsubscribe.email == body.email, Unsubscribe.user_id == current_user.id
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Email already unsubscribed")
    db.add(Unsubscribe(email=body.email, user_id=current_user.id))
    await db.commit()
    return {"message": f"{body.email} added to suppression list"}


@router.delete("/remove/{email}")
async def remove_unsubscribe(
    email: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(Unsubscribe).filter(
            Unsubscribe.email == email, Unsubscribe.user_id == current_user.id
        )
    )
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="Email not in suppression list")
    await db.delete(record)
    await db.commit()
    return {"message": f"{email} removed from suppression list"}
