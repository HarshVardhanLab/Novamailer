from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app import deps
from app.core.database import get_db
from app.models.template import Template
from app.models.user import User
from app.schemas.template import TemplateCreate, Template as TemplateSchema
from pydantic import BaseModel
from app.services.ai_service import ai_service

class TemplatePrompt(BaseModel):
    prompt: str

router = APIRouter()

@router.post("/generate")
async def generate_template_ai(
    request: TemplatePrompt,
    current_user: User = Depends(deps.get_current_user),
):
    try:
        content = await ai_service.generate_template(request.prompt)
        return {"html_content": content}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

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

@router.get("/{template_id}", response_model=TemplateSchema)
async def read_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(select(Template).filter(Template.id == template_id, Template.user_id == current_user.id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.put("/{template_id}", response_model=TemplateSchema)
async def update_template(
    template_id: int,
    template_update: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(select(Template).filter(Template.id == template_id, Template.user_id == current_user.id))
    db_template = result.scalar_one_or_none()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Update template fields
    for key, value in template_update.dict().items():
        setattr(db_template, key, value)
    
    await db.commit()
    await db.refresh(db_template)
    return db_template

@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(select(Template).filter(Template.id == template_id, Template.user_id == current_user.id))
    db_template = result.scalar_one_or_none()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    await db.delete(db_template)
    await db.commit()
    return {"message": "Template deleted successfully"}
