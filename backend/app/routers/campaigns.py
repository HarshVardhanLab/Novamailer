import csv
import io
import secrets
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case, or_
from pydantic import BaseModel

from app import deps
from app.core.database import get_db
from app.core.config import settings
from app.models.campaign import Campaign
from app.models.user import User
from app.models.attachment import Attachment
from app.models.recipient import Recipient
from app.models.email_tracking import EmailTracking
from app.models.unsubscribe import Unsubscribe
from app.schemas.campaign import CampaignCreate, Campaign as CampaignSchema
from app.services.ai_service import ai_service


class CampaignTopic(BaseModel):
    topic: str


router = APIRouter()


# ── AI suggest ────────────────────────────────────────────────────────────────

@router.post("/suggest")
async def suggest_campaign_ai(
    request: CampaignTopic,
    current_user: User = Depends(deps.get_current_user),
):
    try:
        return await ai_service.suggest_campaign(request.topic)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI suggestion failed: {str(e)}")


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.post("/", response_model=CampaignSchema)
async def create_campaign(
    campaign: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    data = campaign.dict()
    status = "scheduled" if data.get("scheduled_at") else "draft"
    db_campaign = Campaign(**data, user_id=current_user.id, status=status)
    db.add(db_campaign)
    await db.commit()
    await db.refresh(db_campaign)
    return db_campaign


@router.get("/", response_model=List[CampaignSchema])
async def read_campaigns(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    query = select(Campaign).filter(Campaign.user_id == current_user.id)
    if search:
        query = query.filter(
            or_(Campaign.name.ilike(f"%{search}%"), Campaign.subject.ilike(f"%{search}%"))
        )
    if status:
        query = query.filter(Campaign.status == status)
    query = query.order_by(Campaign.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/count")
async def count_campaigns(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    query = select(func.count(Campaign.id)).filter(Campaign.user_id == current_user.id)
    if search:
        query = query.filter(
            or_(Campaign.name.ilike(f"%{search}%"), Campaign.subject.ilike(f"%{search}%"))
        )
    if status:
        query = query.filter(Campaign.status == status)
    result = await db.execute(query)
    return {"count": result.scalar() or 0}


@router.get("/{campaign_id}", response_model=CampaignSchema)
async def read_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
    )
    campaign = result.scalars().first()
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
    )
    campaign = result.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    await db.delete(campaign)
    await db.commit()
    return {"message": "Campaign deleted successfully"}


# ── Duplicate ─────────────────────────────────────────────────────────────────

@router.post("/{campaign_id}/duplicate", response_model=CampaignSchema)
async def duplicate_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
    )
    original = result.scalars().first()
    if not original:
        raise HTTPException(status_code=404, detail="Campaign not found")

    clone = Campaign(
        name=f"{original.name} (Copy)",
        subject=original.subject,
        body=original.body,
        status="draft",
        user_id=current_user.id,
    )
    db.add(clone)
    await db.commit()
    await db.refresh(clone)
    return clone


# ── Details ───────────────────────────────────────────────────────────────────

@router.get("/{campaign_id}/details")
async def get_campaign_details(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
    )
    campaign = result.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    stats_query = await db.execute(
        select(
            func.count(Recipient.id).label("total"),
            func.sum(case((Recipient.status == "sent", 1), else_=0)).label("sent"),
            func.sum(case((Recipient.status == "pending", 1), else_=0)).label("pending"),
            func.sum(case((Recipient.status == "failed", 1), else_=0)).label("failed"),
        ).filter(Recipient.campaign_id == campaign_id)
    )
    stats = stats_query.first()

    # Tracking stats
    tracking_query = await db.execute(
        select(
            func.count(EmailTracking.id).label("total_tracked"),
            func.sum(case((EmailTracking.opened == True, 1), else_=0)).label("opened"),
            func.sum(case((EmailTracking.clicked == True, 1), else_=0)).label("clicked"),
        ).filter(EmailTracking.campaign_id == campaign_id)
    )
    tracking = tracking_query.first()

    sent = stats.sent or 0
    open_rate = round((tracking.opened or 0) / sent * 100, 2) if sent > 0 else 0
    click_rate = round((tracking.clicked or 0) / sent * 100, 2) if sent > 0 else 0

    recipients_result = await db.execute(
        select(Recipient).filter(Recipient.campaign_id == campaign_id).limit(100)
    )
    recipients = recipients_result.scalars().all()

    return {
        "id": campaign.id,
        "name": campaign.name,
        "subject": campaign.subject,
        "body": campaign.body,
        "status": campaign.status,
        "created_at": campaign.created_at,
        "scheduled_at": campaign.scheduled_at,
        "user_id": campaign.user_id,
        "stats": {
            "total_recipients": stats.total or 0,
            "sent": sent,
            "pending": stats.pending or 0,
            "failed": stats.failed or 0,
            "open_rate": open_rate,
            "click_rate": click_rate,
        },
        "recipients": [
            {"id": r.id, "email": r.email, "status": r.status, "data": r.data}
            for r in recipients
        ],
    }


# ── Export CSV ────────────────────────────────────────────────────────────────

@router.get("/{campaign_id}/export")
async def export_campaign_report(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
    )
    campaign = result.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    recipients_result = await db.execute(
        select(Recipient).filter(Recipient.campaign_id == campaign_id)
    )
    recipients = recipients_result.scalars().all()

    # Build tracking map
    tracking_result = await db.execute(
        select(EmailTracking).filter(EmailTracking.campaign_id == campaign_id)
    )
    tracking_map = {t.recipient_id: t for t in tracking_result.scalars().all()}

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["email", "status", "opened", "open_count", "clicked", "click_count", "sent_at"])

    for r in recipients:
        t = tracking_map.get(r.id)
        writer.writerow([
            r.email,
            r.status,
            t.opened if t else False,
            t.open_count if t else 0,
            t.clicked if t else False,
            t.click_count if t else 0,
            r.sent_at.isoformat() if r.sent_at else "",
        ])

    output.seek(0)
    filename = f"campaign_{campaign_id}_{campaign.name.replace(' ', '_')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ── CSV Upload ────────────────────────────────────────────────────────────────

@router.post("/{campaign_id}/upload-csv")
async def upload_csv(
    campaign_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
    )
    campaign = result.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    from app.services import csv_service

    data = await csv_service.parse_csv(file)

    # Load unsubscribed emails for this user
    unsub_result = await db.execute(
        select(Unsubscribe.email).filter(Unsubscribe.user_id == current_user.id)
    )
    unsubscribed = {row[0].lower() for row in unsub_result.all()}

    added = 0
    skipped = 0
    for row in data:
        email = next((v for k, v in row.items() if k.lower() == "email"), None)
        if email:
            if email.lower() in unsubscribed:
                skipped += 1
                continue
            db.add(Recipient(email=email, data=row, campaign_id=campaign.id))
            added += 1

    await db.commit()
    return {"message": f"Added {added} recipients, skipped {skipped} unsubscribed"}


# ── Preview ───────────────────────────────────────────────────────────────────

@router.post("/{campaign_id}/preview")
async def preview_campaign(
    campaign_id: int,
    sample_data: dict = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
    )
    campaign = result.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    from app.services import template_service

    if not sample_data:
        sample_data = {"name": "John Doe", "email": "john@example.com", "company": "Acme Corp"}

    try:
        rendered_subject = template_service.render_template(campaign.subject, sample_data)
        rendered_body = template_service.render_template(campaign.body, sample_data)
        return {"subject": rendered_subject, "body": rendered_body, "sample_data": sample_data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Template rendering error: {str(e)}")


# ── Test Send ─────────────────────────────────────────────────────────────────

@router.post("/{campaign_id}/test-send")
async def send_test_email(
    campaign_id: int,
    test_email: str = Query(...),
    sample_data: Optional[dict] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
    )
    campaign = result.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    from app.models.smtp import SMTPConfig
    smtp_result = await db.execute(select(SMTPConfig).filter(SMTPConfig.user_id == current_user.id))
    smtp_config = smtp_result.scalars().first()
    if not smtp_config:
        raise HTTPException(status_code=400, detail="SMTP Configuration not found")

    from app.services import email, template_service

    if not sample_data:
        sample_data = {"name": "Test User", "email": test_email, "company": "Test Company"}

    att_result = await db.execute(select(Attachment).filter(Attachment.campaign_id == campaign_id))
    attachments = att_result.scalars().all()
    attachment_data = [
        {"filename": a.filename, "content_type": a.content_type, "data": a.file_data}
        for a in attachments
    ] if attachments else None

    try:
        rendered_subject = template_service.render_template(campaign.subject, sample_data)
        rendered_body = template_service.render_template(campaign.body, sample_data)
        await email.send_email(smtp_config, test_email, f"[TEST] {rendered_subject}", rendered_body, attachments=attachment_data)
        return {"message": f"Test email sent to {test_email}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send test email: {str(e)}")


# ── Attachments ───────────────────────────────────────────────────────────────

@router.post("/{campaign_id}/attachments")
async def upload_attachment(
    campaign_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
    )
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Campaign not found")

    file_content = await file.read()
    if len(file_content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 25MB")

    attachment = Attachment(
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        file_data=file_content,
        file_size=len(file_content),
        campaign_id=campaign_id,
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)
    return {"id": attachment.id, "filename": attachment.filename, "content_type": attachment.content_type, "file_size": attachment.file_size}


@router.get("/{campaign_id}/attachments")
async def list_attachments(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
    )
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Campaign not found")

    att_result = await db.execute(select(Attachment).filter(Attachment.campaign_id == campaign_id))
    return [
        {"id": a.id, "filename": a.filename, "content_type": a.content_type, "file_size": a.file_size}
        for a in att_result.scalars().all()
    ]


@router.delete("/{campaign_id}/attachments/{attachment_id}")
async def delete_attachment(
    campaign_id: int,
    attachment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
    )
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Campaign not found")

    att_result = await db.execute(
        select(Attachment).filter(Attachment.id == attachment_id, Attachment.campaign_id == campaign_id)
    )
    attachment = att_result.scalars().first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    await db.delete(attachment)
    await db.commit()
    return {"message": "Attachment deleted"}


# ── Send Campaign ─────────────────────────────────────────────────────────────

@router.post("/{campaign_id}/send")
async def send_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
    )
    campaign = result.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    from app.models.smtp import SMTPConfig
    smtp_result = await db.execute(select(SMTPConfig).filter(SMTPConfig.user_id == current_user.id))
    smtp_config = smtp_result.scalars().first()
    if not smtp_config:
        raise HTTPException(status_code=400, detail="SMTP Configuration not found")

    recipients_result = await db.execute(
        select(Recipient).filter(Recipient.campaign_id == campaign.id, Recipient.status == "pending")
    )
    recipients = recipients_result.scalars().all()
    if not recipients:
        raise HTTPException(status_code=400, detail="No pending recipients found")

    att_result = await db.execute(select(Attachment).filter(Attachment.campaign_id == campaign_id))
    attachments = att_result.scalars().all()
    attachment_data = [
        {"filename": a.filename, "content_type": a.content_type, "data": a.file_data}
        for a in attachments
    ] if attachments else None

    from app.services import email as email_svc, template_service
    from app.services.webhook_service import fire_event

    base_url = getattr(settings, "BASE_URL", "http://localhost:8000/api/v1")

    campaign.status = "sending"
    await db.commit()

    sent_count = 0
    failed_count = 0

    for recipient in recipients:
        tracking_id = secrets.token_hex(32)
        try:
            subject = template_service.render_template(campaign.subject, recipient.data or {})
            body = template_service.render_template(campaign.body, recipient.data or {})
            unsubscribe_url = f"{base_url}/unsubscribe/{tracking_id}"

            await email_svc.send_email(
                smtp_config,
                recipient.email,
                subject,
                body,
                attachments=attachment_data,
                tracking_id=tracking_id,
                base_url=base_url,
                unsubscribe_url=unsubscribe_url,
            )
            recipient.status = "sent"
            recipient.sent_at = datetime.utcnow()
            sent_count += 1

            # Create tracking record
            tracking = EmailTracking(
                recipient_id=recipient.id,
                campaign_id=campaign_id,
                tracking_id=tracking_id,
            )
            db.add(tracking)

            await fire_event(db, current_user.id, "email.sent", {"email": recipient.email, "campaign_id": campaign_id})
        except Exception as e:
            print(f"Failed to send to {recipient.email}: {e}")
            recipient.status = "failed"
            failed_count += 1
            await fire_event(db, current_user.id, "email.failed", {"email": recipient.email, "campaign_id": campaign_id})

    campaign.status = "completed"
    await db.commit()

    await fire_event(db, current_user.id, "campaign.completed", {
        "campaign_id": campaign_id,
        "sent": sent_count,
        "failed": failed_count,
    })

    return {"message": "Campaign completed", "sent": sent_count, "failed": failed_count, "total": sent_count + failed_count}
