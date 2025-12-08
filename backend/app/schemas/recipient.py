from typing import Optional, Dict, Any
from pydantic import BaseModel

class RecipientBase(BaseModel):
    email: str
    data: Optional[Dict[str, Any]] = None

class RecipientCreate(RecipientBase):
    campaign_id: int

class RecipientInDBBase(RecipientBase):
    id: int
    status: str
    campaign_id: int

    class Config:
        from_attributes = True

class Recipient(RecipientInDBBase):
    pass
