from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from app import deps
from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.recipient import Recipient
from app.models.user import User

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Get dashboard statistics"""
    
    # Total campaigns
    campaigns_result = await db.execute(
        select(func.count(Campaign.id)).filter(Campaign.user_id == current_user.id)
    )
    total_campaigns = campaigns_result.scalar() or 0
    
    # Campaign status breakdown
    status_result = await db.execute(
        select(
            Campaign.status,
            func.count(Campaign.id)
        ).filter(Campaign.user_id == current_user.id).group_by(Campaign.status)
    )
    status_breakdown = {row[0]: row[1] for row in status_result.all()}
    
    # Get all campaign IDs for this user
    campaign_ids_result = await db.execute(
        select(Campaign.id).filter(Campaign.user_id == current_user.id)
    )
    campaign_ids = [row[0] for row in campaign_ids_result.all()]
    
    # Recipient stats across all campaigns
    if campaign_ids:
        recipient_stats = await db.execute(
            select(
                func.count(Recipient.id).label('total'),
                func.sum(case((Recipient.status == 'sent', 1), else_=0)).label('sent'),
                func.sum(case((Recipient.status == 'failed', 1), else_=0)).label('failed'),
                func.sum(case((Recipient.status == 'pending', 1), else_=0)).label('pending')
            ).filter(Recipient.campaign_id.in_(campaign_ids))
        )
        stats = recipient_stats.first()
        
        total_emails = stats.total or 0
        sent_emails = stats.sent or 0
        failed_emails = stats.failed or 0
        pending_emails = stats.pending or 0
    else:
        total_emails = sent_emails = failed_emails = pending_emails = 0
    
    # Recent campaigns
    recent_campaigns_result = await db.execute(
        select(Campaign)
        .filter(Campaign.user_id == current_user.id)
        .order_by(Campaign.created_at.desc())
        .limit(5)
    )
    recent_campaigns = recent_campaigns_result.scalars().all()
    
    return {
        "total_campaigns": total_campaigns,
        "campaigns_by_status": status_breakdown,
        "total_emails": total_emails,
        "sent_emails": sent_emails,
        "failed_emails": failed_emails,
        "pending_emails": pending_emails,
        "success_rate": round((sent_emails / total_emails * 100) if total_emails > 0 else 0, 2),
        "recent_campaigns": [
            {
                "id": c.id,
                "name": c.name,
                "status": c.status,
                "created_at": c.created_at
            } for c in recent_campaigns
        ]
    }
