from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.security import encrypt_password, decrypt_password

class SMTPConfig(Base):
    __tablename__ = "smtp_configs"

    id = Column(Integer, primary_key=True, index=True)
    host = Column(String(255), nullable=False)
    port = Column(Integer, nullable=False)
    username = Column(String(255), nullable=False)
    _password = Column("password", String(512), nullable=False)
    from_email = Column(String(255), nullable=False)
    
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", backref="smtp_config")

    @property
    def password(self) -> str:
        """Decrypt password when accessed"""
        return decrypt_password(self._password) if self._password else ""

    @password.setter
    def password(self, plain_password: str):
        """Encrypt password when set"""
        if plain_password:
            self._password = encrypt_password(plain_password)
