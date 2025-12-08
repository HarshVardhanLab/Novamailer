from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr
from datetime import datetime

class CampaignBase(BaseModel):
    name: str
    subject: str
    body: str

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(CampaignBase):
    pass

class CampaignInDBBase(CampaignBase):
    id: int
    created_at: datetime
    status: str
    user_id: int

    class Config:
        from_attributes = True

class Campaign(CampaignInDBBase):
    pass

class CampaignStats(BaseModel):
    total_recipients: int
    sent: int
    pending: int
    failed: int
    
class CampaignDetail(CampaignInDBBase):
    stats: CampaignStats
    recipients: List[Dict[str, Any]] = []

class EmailPreview(BaseModel):
    subject: str
    body: str
    sample_data: Dict[str, Any]

class TestEmailRequest(BaseModel):
    test_email: EmailStr
    sample_data: Optional[Dict[str, Any]] = None
