from sqlalchemy import Column, Integer, String, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship
from app.core.database import Base

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)  # image/jpeg, video/mp4, application/pdf, etc.
    file_data = Column(LargeBinary, nullable=False)  # Store file content
    file_size = Column(Integer, nullable=False)  # Size in bytes
    
    campaign_id = Column(Integer, ForeignKey("campaigns.id"))
    campaign = relationship("Campaign", backref="attachments")
