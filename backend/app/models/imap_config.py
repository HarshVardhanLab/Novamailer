from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.security import encrypt_password, decrypt_password

class IMAPConfig(Base):
    __tablename__ = "imap_configs"

    id = Column(Integer, primary_key=True, index=True)
    host = Column(String(255), nullable=False)
    port = Column(Integer, nullable=False, default=993)
    username = Column(String(255), nullable=False)
    _password = Column("password", String(512), nullable=False)

    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    user = relationship("User", backref="imap_config")

    @property
    def password(self) -> str:
        """Decrypt password when accessed"""
        return decrypt_password(self._password) if self._password else ""

    @password.setter
    def password(self, plain_password: str):
        """Encrypt password when set"""
        if plain_password:
            self._password = encrypt_password(plain_password)
