import io
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app import deps
from app.core.database import get_db
from app.models.recipient_list import RecipientList, RecipientContact
from app.models.user import User

router = APIRouter()


class ListCreate(BaseModel):
    name: str
    description: Optional[str] = None


@router.get("/", response_model=List[dict])
async def get_lists(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(select(RecipientList).filter(RecipientList.user_id == current_user.id))
    lists = result.scalars().all()
    out = []
    for lst in lists:
        count_result = await db.execute(
            select(RecipientContact).filter(RecipientContact.list_id == lst.id)
        )
        count = len(count_result.scalars().all())
        out.append({"id": lst.id, "name": lst.name, "description": lst.description, "contact_count": count, "created_at": lst.created_at})
    return out


@router.post("/")
async def create_list(
    body: ListCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    lst = RecipientList(**body.dict(), user_id=current_user.id)
    db.add(lst)
    await db.commit()
    await db.refresh(lst)
    return {"id": lst.id, "name": lst.name, "description": lst.description}


@router.delete("/{list_id}")
async def delete_list(
    list_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(RecipientList).filter(RecipientList.id == list_id, RecipientList.user_id == current_user.id)
    )
    lst = result.scalars().first()
    if not lst:
        raise HTTPException(status_code=404, detail="List not found")
    await db.delete(lst)
    await db.commit()
    return {"message": "List deleted"}


@router.post("/{list_id}/upload-csv")
async def upload_contacts(
    list_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(RecipientList).filter(RecipientList.id == list_id, RecipientList.user_id == current_user.id)
    )
    lst = result.scalars().first()
    if not lst:
        raise HTTPException(status_code=404, detail="List not found")

    from app.services import csv_service
    data = await csv_service.parse_csv(file)

    added = 0
    for row in data:
        email = next((v for k, v in row.items() if k.lower() == "email"), None)
        if email:
            db.add(RecipientContact(email=email, data=row, list_id=list_id))
            added += 1

    await db.commit()
    return {"message": f"Added {added} contacts"}


@router.get("/{list_id}/contacts")
async def get_contacts(
    list_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(RecipientList).filter(RecipientList.id == list_id, RecipientList.user_id == current_user.id)
    )
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="List not found")

    contacts_result = await db.execute(
        select(RecipientContact).filter(RecipientContact.list_id == list_id)
    )
    return [{"id": c.id, "email": c.email, "data": c.data} for c in contacts_result.scalars().all()]


@router.post("/{list_id}/import-to-campaign/{campaign_id}")
async def import_list_to_campaign(
    list_id: int,
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    from app.models.campaign import Campaign
    from app.models.recipient import Recipient
    from app.models.unsubscribe import Unsubscribe

    lst_result = await db.execute(
        select(RecipientList).filter(RecipientList.id == list_id, RecipientList.user_id == current_user.id)
    )
    if not lst_result.scalars().first():
        raise HTTPException(status_code=404, detail="List not found")

    camp_result = await db.execute(
        select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
    )
    if not camp_result.scalars().first():
        raise HTTPException(status_code=404, detail="Campaign not found")

    unsub_result = await db.execute(
        select(Unsubscribe.email).filter(Unsubscribe.user_id == current_user.id)
    )
    unsubscribed = {row[0].lower() for row in unsub_result.all()}

    contacts_result = await db.execute(
        select(RecipientContact).filter(RecipientContact.list_id == list_id)
    )
    contacts = contacts_result.scalars().all()

    added = skipped = 0
    for c in contacts:
        if c.email.lower() in unsubscribed:
            skipped += 1
            continue
        db.add(Recipient(email=c.email, data=c.data, campaign_id=campaign_id))
        added += 1

    await db.commit()
    return {"message": f"Imported {added} recipients, skipped {skipped} unsubscribed"}
