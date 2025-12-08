from typing import Union
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app import deps
from app.core.database import get_db
from app.models.smtp import SMTPConfig
from app.models.user import User
from app.schemas.smtp import SMTPConfigCreate, SMTPConfigUpdate, SMTPConfig as SMTPConfigSchema

router = APIRouter()

@router.post("/", response_model=SMTPConfigSchema)
async def create_or_update_smtp(
    smtp_data: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(select(SMTPConfig).filter(SMTPConfig.user_id == current_user.id))
    smtp_config = result.scalars().first()
    
    if smtp_config:
        # Update existing config
        for key, value in smtp_data.items():
            if key == 'password' and (value is None or value == ''):
                # Skip password update if empty
                continue
            if hasattr(smtp_config, key):
                setattr(smtp_config, key, value)
    else:
        # Create new config - password is required
        if 'password' not in smtp_data or not smtp_data['password']:
            raise HTTPException(status_code=400, detail="Password is required for new SMTP configuration")
        smtp_config = SMTPConfig(**smtp_data, user_id=current_user.id)
        db.add(smtp_config)
    
    await db.commit()
    await db.refresh(smtp_config)
    return smtp_config

@router.get("/", response_model=SMTPConfigSchema)
async def read_smtp(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(select(SMTPConfig).filter(SMTPConfig.user_id == current_user.id))
    smtp_config = result.scalars().first()
    if smtp_config is None:
        raise HTTPException(status_code=404, detail="SMTP Config not found")
    return smtp_config
