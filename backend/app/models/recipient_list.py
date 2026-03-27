from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class RecipientList(Base):
    __tablename__ = "recipient_lists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="recipient_lists")
    contacts = relationship("RecipientContact", backref="list", cascade="all, delete-orphan")


class RecipientContact(Base):
    __tablename__ = "recipient_contacts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False)
    data = Column(JSON, nullable=True)
    list_id = Column(Integer, ForeignKey("recipient_lists.id"), nullable=False)
