from typing import Optional
from pydantic import BaseModel

class TemplateBase(BaseModel):
    name: str
    content: str

class TemplateCreate(TemplateBase):
    pass

class TemplateUpdate(TemplateBase):
    pass

class TemplateInDBBase(TemplateBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class Template(TemplateInDBBase):
    pass
