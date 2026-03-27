from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class EmailTracking(Base):
    __tablename__ = "email_tracking"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("recipients.id"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    tracking_id = Column(String(64), unique=True, nullable=False, index=True)
    opened = Column(Boolean, default=False)
    opened_at = Column(DateTime, nullable=True)
    open_count = Column(Integer, default=0)
    clicked = Column(Boolean, default=False)
    clicked_at = Column(DateTime, nullable=True)
    click_count = Column(Integer, default=0)
    last_clicked_url = Column(String(2048), nullable=True)

    recipient = relationship("Recipient", backref="tracking")
    campaign = relationship("Campaign", backref="tracking")
