from typing import Optional
from pydantic import BaseModel

class SMTPConfigBase(BaseModel):
    host: str
    port: int
    username: str
    from_email: str

class SMTPConfigCreate(SMTPConfigBase):
    password: str

class SMTPConfigUpdate(SMTPConfigBase):
    password: Optional[str] = None

class SMTPConfigInDBBase(SMTPConfigBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class SMTPConfig(SMTPConfigInDBBase):
    pass
