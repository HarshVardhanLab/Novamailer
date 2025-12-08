from pydantic import BaseModel

class AttachmentBase(BaseModel):
    filename: str
    content_type: str
    file_size: int

class AttachmentCreate(AttachmentBase):
    pass

class AttachmentInDBBase(AttachmentBase):
    id: int
    campaign_id: int

    class Config:
        from_attributes = True

class Attachment(AttachmentInDBBase):
    pass
