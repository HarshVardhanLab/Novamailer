from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt
import bcrypt
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hashed password using bcrypt"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# ── Symmetric encryption for sensitive data (SMTP/IMAP passwords) ────────────

def _get_encryption_key() -> bytes:
    """Derive a Fernet key from the SECRET_KEY"""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b'novamailer_salt_v1',  # Static salt for deterministic key
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(settings.SECRET_KEY.encode()))
    return key

def encrypt_password(plain_password: str) -> str:
    """Encrypt a password for storage (reversible encryption)"""
    if not plain_password:
        return ""
    f = Fernet(_get_encryption_key())
    encrypted = f.encrypt(plain_password.encode('utf-8'))
    return encrypted.decode('utf-8')

def decrypt_password(encrypted_password: str) -> str:
    """Decrypt a stored password"""
    if not encrypted_password:
        return ""
    try:
        f = Fernet(_get_encryption_key())
        decrypted = f.decrypt(encrypted_password.encode('utf-8'))
        return decrypted.decode('utf-8')
    except Exception:
        # If decryption fails, assume it's already plain text (migration case)
        return encrypted_password
