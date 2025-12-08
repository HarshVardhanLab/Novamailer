from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from app import deps
from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.user import User
from app.models.attachment import Attachment
from app.schemas.campaign import CampaignCreate, Campaign as CampaignSchema

router = APIRouter()

@router.post("/", response_model=CampaignSchema)
async def create_campaign(
    campaign: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    db_campaign = Campaign(**campaign.dict(), user_id=current_user.id)
    db.add(db_campaign)
    await db.commit()
    await db.refresh(db_campaign)
    return db_campaign

@router.get("/", response_model=List[CampaignSchema])
async def read_campaigns(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(select(Campaign).filter(Campaign.user_id == current_user.id).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/{campaign_id}", response_model=CampaignSchema)
async def read_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id))
    campaign = result.scalars().first()
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.post("/{campaign_id}/upload-csv")
async def upload_csv(
    campaign_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    # Verify campaign ownership
    result = await db.execute(select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id))
    campaign = result.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    from app.services import csv_service
    from app.models.recipient import Recipient
    
    data = await csv_service.parse_csv(file)
    
    # Create recipients
    for row in data:
        # Find email column case-insensitively
        email = None
        for k, v in row.items():
            if k.lower() == 'email':
                email = v
                break
        
        if email:
            recipient = Recipient(email=email, data=row, campaign_id=campaign.id)
            db.add(recipient)
    
    await db.commit()
    return {"message": f"Successfully added {len(data)} recipients"}

@router.get("/{campaign_id}/details")
async def get_campaign_details(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Get detailed campaign information including stats and recipients"""
    from app.models.recipient import Recipient
    from sqlalchemy import func
    
    # Verify campaign ownership
    result = await db.execute(select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id))
    campaign = result.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get recipient stats
    stats_query = await db.execute(
        select(
            func.count(Recipient.id).label('total'),
            func.sum(case((Recipient.status == 'sent', 1), else_=0)).label('sent'),
            func.sum(case((Recipient.status == 'pending', 1), else_=0)).label('pending'),
            func.sum(case((Recipient.status == 'failed', 1), else_=0)).label('failed')
        ).filter(Recipient.campaign_id == campaign_id)
    )
    stats = stats_query.first()
    
    # Get recipients
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
        "user_id": campaign.user_id,
        "stats": {
            "total_recipients": stats.total or 0,
            "sent": stats.sent or 0,
            "pending": stats.pending or 0,
            "failed": stats.failed or 0
        },
        "recipients": [
            {
                "id": r.id,
                "email": r.email,
                "status": r.status,
                "data": r.data
            } for r in recipients
        ]
    }

@router.post("/{campaign_id}/preview")
async def preview_campaign(
    campaign_id: int,
    sample_data: dict = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Preview campaign email with sample data"""
    result = await db.execute(select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id))
    campaign = result.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    from app.services import template_service
    
    # Use provided sample data or default
    if not sample_data:
        sample_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "company": "Acme Corp"
        }
    
    try:
        # Render both subject and body with sample data
        rendered_subject = template_service.render_template(campaign.subject, sample_data)
        rendered_body = template_service.render_template(campaign.body, sample_data)
        return {
            "subject": rendered_subject,
            "body": rendered_body,
            "sample_data": sample_data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Template rendering error: {str(e)}")

@router.post("/{campaign_id}/test-send")
async def send_test_email(
    campaign_id: int,
    test_email: str = Query(..., description="Email address to send test to"),
    sample_data: Optional[dict] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Send a test email to verify campaign before sending"""
    result = await db.execute(select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id))
    campaign = result.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get SMTP config
    from app.models.smtp import SMTPConfig
    result = await db.execute(select(SMTPConfig).filter(SMTPConfig.user_id == current_user.id))
    smtp_config = result.scalars().first()
    if not smtp_config:
        raise HTTPException(status_code=400, detail="SMTP Configuration not found")
    
    from app.services import email, template_service
    
    # Use provided sample data or default
    if not sample_data:
        sample_data = {
            "name": "Test User",
            "email": test_email,
            "company": "Test Company"
        }
    
    try:
        # Render both subject and body with template variables
        rendered_subject = template_service.render_template(campaign.subject, sample_data)
        rendered_body = template_service.render_template(campaign.body, sample_data)
        await email.send_email(smtp_config, test_email, f"[TEST] {rendered_subject}", rendered_body)
        return {"message": f"Test email sent to {test_email}"}
    except Exception as e:
        import traceback
        error_detail = f"Failed to send test email: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Log to console
        raise HTTPException(status_code=500, detail=f"Failed to send test email: {str(e)}")

@router.post("/{campaign_id}/attachments")
async def upload_attachment(
    campaign_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Upload attachment to campaign"""
    # Verify campaign ownership
    result = await db.execute(select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id))
    campaign = result.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Check file size (max 25MB for Gmail)
    max_size = 25 * 1024 * 1024  # 25MB
    if file_size > max_size:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size is 25MB")
    
    # Create attachment
    attachment = Attachment(
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        file_data=file_content,
        file_size=file_size,
        campaign_id=campaign_id
    )
    
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)
    
    return {
        "id": attachment.id,
        "filename": attachment.filename,
        "content_type": attachment.content_type,
        "file_size": attachment.file_size
    }

@router.get("/{campaign_id}/attachments")
async def list_attachments(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """List all attachments for a campaign"""
    # Verify campaign ownership
    result = await db.execute(select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id))
    campaign = result.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get attachments
    result = await db.execute(select(Attachment).filter(Attachment.campaign_id == campaign_id))
    attachments = result.scalars().all()
    
    return [
        {
            "id": a.id,
            "filename": a.filename,
            "content_type": a.content_type,
            "file_size": a.file_size
        } for a in attachments
    ]

@router.delete("/{campaign_id}/attachments/{attachment_id}")
async def delete_attachment(
    campaign_id: int,
    attachment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Delete an attachment"""
    # Verify campaign ownership
    result = await db.execute(select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id))
    campaign = result.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get and delete attachment
    result = await db.execute(select(Attachment).filter(Attachment.id == attachment_id, Attachment.campaign_id == campaign_id))
    attachment = result.scalars().first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    await db.delete(attachment)
    await db.commit()
    
    return {"message": "Attachment deleted"}

@router.post("/{campaign_id}/send")
async def send_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    # Verify campaign ownership
    result = await db.execute(select(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id))
    campaign = result.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get SMTP config
    from app.models.smtp import SMTPConfig
    result = await db.execute(select(SMTPConfig).filter(SMTPConfig.user_id == current_user.id))
    smtp_config = result.scalars().first()
    if not smtp_config:
        raise HTTPException(status_code=400, detail="SMTP Configuration not found")

    # Get recipients
    from app.models.recipient import Recipient
    result = await db.execute(select(Recipient).filter(Recipient.campaign_id == campaign.id, Recipient.status == "pending"))
    recipients = result.scalars().all()
    
    if not recipients:
        raise HTTPException(status_code=400, detail="No pending recipients found")
    
    # Get attachments
    result = await db.execute(select(Attachment).filter(Attachment.campaign_id == campaign_id))
    attachments = result.scalars().all()
    
    # Prepare attachment data
    attachment_data = [
        {
            "filename": a.filename,
            "content_type": a.content_type,
            "data": a.file_data
        } for a in attachments
    ] if attachments else None
    
    from app.services import email, template_service
    
    campaign.status = "sending"
    await db.commit()
    
    sent_count = 0
    failed_count = 0
    
    for recipient in recipients:
        try:
            # Render both subject and body with recipient data
            subject = template_service.render_template(campaign.subject, recipient.data or {})
            body = template_service.render_template(campaign.body, recipient.data or {})
            
            # Send email with attachments
            await email.send_email(
                smtp_config, 
                recipient.email, 
                subject, 
                body,
                attachments=attachment_data
            )
            recipient.status = "sent"
            sent_count += 1
        except Exception as e:
            print(f"Failed to send to {recipient.email}: {e}")
            recipient.status = "failed"
            failed_count += 1
            
    campaign.status = "completed"
    await db.commit()
    
    return {
        "message": f"Campaign completed",
        "sent": sent_count,
        "failed": failed_count,
        "total": sent_count + failed_count,
        "attachments": len(attachments) if attachments else 0
    }
