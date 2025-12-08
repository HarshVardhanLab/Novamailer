from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class SMTPConfig(Base):
    __tablename__ = "smtp_configs"

    id = Column(Integer, primary_key=True, index=True)
    host = Column(String(255), nullable=False)
    port = Column(Integer, nullable=False)
    username = Column(String(255), nullable=False)
    password = Column(String(255), nullable=False) # Should be encrypted
    from_email = Column(String(255), nullable=False)
    
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", backref="smtp_config")
