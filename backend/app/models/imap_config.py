from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.security import encrypt_password, decrypt_password
from datetime import datetime

class IMAPConfig(Base):
    __tablename__ = "imap_configs"

    id = Column(Integer, primary_key=True, index=True)
    host = Column(String(255), nullable=False)
    port = Column(Integer, nullable=False, default=993)
    username = Column(String(255), nullable=False)
    _password = Column("password", String(512), nullable=False)

    # OAuth fields (shared with SMTP)
    auth_type = Column(String(50), default="password")  # "password" or "oauth"
    oauth_provider = Column(String(50), nullable=True)  # "google" or "microsoft"
    _oauth_access_token = Column("oauth_access_token", String(2048), nullable=True)
    _oauth_refresh_token = Column("oauth_refresh_token", String(2048), nullable=True)
    oauth_token_expires_at = Column(DateTime, nullable=True)

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
    
    @property
    def oauth_access_token(self) -> str:
        """Decrypt OAuth access token when accessed"""
        return decrypt_password(self._oauth_access_token) if self._oauth_access_token else ""

    @oauth_access_token.setter
    def oauth_access_token(self, token: str):
        """Encrypt OAuth access token when set"""
        if token:
            self._oauth_access_token = encrypt_password(token)
    
    @property
    def oauth_refresh_token(self) -> str:
        """Decrypt OAuth refresh token when accessed"""
        return decrypt_password(self._oauth_refresh_token) if self._oauth_refresh_token else ""

    @oauth_refresh_token.setter
    def oauth_refresh_token(self, token: str):
        """Encrypt OAuth refresh token when set"""
        if token:
            self._oauth_refresh_token = encrypt_password(token)
