from fastapi import APIRouter, Depends
from fastapi.responses import Response, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.core.database import get_db
from app.models.email_tracking import EmailTracking

router = APIRouter()

# 1x1 transparent GIF
PIXEL = (
    b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00"
    b"\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x00\x00\x00\x00"
    b"\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02"
    b"\x44\x01\x00\x3b"
)


@router.get("/open/{tracking_id}")
async def track_open(tracking_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(EmailTracking).filter(EmailTracking.tracking_id == tracking_id)
    )
    record = result.scalars().first()
    if record:
        record.opened = True
        record.open_count += 1
        if not record.opened_at:
            record.opened_at = datetime.utcnow()
        await db.commit()
    return Response(content=PIXEL, media_type="image/gif")


@router.get("/click/{tracking_id}")
async def track_click(tracking_id: str, url: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(EmailTracking).filter(EmailTracking.tracking_id == tracking_id)
    )
    record = result.scalars().first()
    if record:
        record.clicked = True
        record.click_count += 1
        record.last_clicked_url = url
        if not record.clicked_at:
            record.clicked_at = datetime.utcnow()
        await db.commit()
    return RedirectResponse(url=url)
