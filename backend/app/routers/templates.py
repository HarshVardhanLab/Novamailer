from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app import deps
from app.core.database import get_db
from app.models.template import Template
from app.models.user import User
from app.schemas.template import TemplateCreate, Template as TemplateSchema

router = APIRouter()

@router.post("/", response_model=TemplateSchema)
async def create_template(
    template: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    db_template = Template(**template.dict(), user_id=current_user.id)
    db.add(db_template)
    await db.commit()
    await db.refresh(db_template)
    return db_template

@router.get("/", response_model=List[TemplateSchema])
async def read_templates(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(select(Template).filter(Template.user_id == current_user.id).offset(skip).limit(limit))
    return result.scalars().all()
