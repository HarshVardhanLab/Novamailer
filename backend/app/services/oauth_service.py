"""
OAuth 2.0 service for Gmail and Microsoft email authentication.
Handles token exchange, refresh, and XOAUTH2 authentication.
"""
import base64
import httpx
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

# OAuth endpoints
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_SCOPES = [
    "https://mail.google.com/",  # Full Gmail access (IMAP + SMTP)
]

MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"
MICROSOFT_AUTH_URL = "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize"
MICROSOFT_SCOPES = [
    "https://outlook.office365.com/IMAP.AccessAsUser.All",
    "https://outlook.office365.com/SMTP.Send",
    "offline_access",  # For refresh token
]


def get_google_auth_url(redirect_uri: str, state: str) -> str:
    """Generate Google OAuth authorization URL."""
    if not settings.GOOGLE_CLIENT_ID:
        raise ValueError("GOOGLE_CLIENT_ID not configured")
    
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(GOOGLE_SCOPES),
        "state": state,
        "access_type": "offline",  # Get refresh token
        "prompt": "consent",  # Force consent to get refresh token
    }
    
    query = "&".join(f"{k}={httpx.QueryParams({k: v})[k]}" for k, v in params.items())
    return f"{GOOGLE_AUTH_URL}?{query}"


def get_microsoft_auth_url(redirect_uri: str, state: str) -> str:
    """Generate Microsoft OAuth authorization URL."""
    if not settings.MICROSOFT_CLIENT_ID:
        raise ValueError("MICROSOFT_CLIENT_ID not configured")
    
    tenant = settings.MICROSOFT_TENANT_ID or "common"
    auth_url = MICROSOFT_AUTH_URL.format(tenant=tenant)
    
    params = {
        "client_id": settings.MICROSOFT_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(MICROSOFT_SCOPES),
        "state": state,
        "response_mode": "query",
    }
    
    query = "&".join(f"{k}={httpx.QueryParams({k: v})[k]}" for k, v in params.items())
    return f"{auth_url}?{query}"


async def exchange_google_code(code: str, redirect_uri: str) -> Dict:
    """Exchange Google authorization code for tokens."""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise ValueError("Google OAuth credentials not configured")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        response.raise_for_status()
        data = response.json()
        
        # Calculate expiration time
        expires_in = data.get("expires_in", 3600)
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        return {
            "access_token": data["access_token"],
            "refresh_token": data.get("refresh_token"),
            "expires_at": expires_at,
            "email": await get_google_email(data["access_token"]),
        }


async def exchange_microsoft_code(code: str, redirect_uri: str) -> Dict:
    """Exchange Microsoft authorization code for tokens."""
    if not settings.MICROSOFT_CLIENT_ID or not settings.MICROSOFT_CLIENT_SECRET:
        raise ValueError("Microsoft OAuth credentials not configured")
    
    tenant = settings.MICROSOFT_TENANT_ID or "common"
    token_url = MICROSOFT_TOKEN_URL.format(tenant=tenant)
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            token_url,
            data={
                "code": code,
                "client_id": settings.MICROSOFT_CLIENT_ID,
                "client_secret": settings.MICROSOFT_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
                "scope": " ".join(MICROSOFT_SCOPES),
            },
        )
        response.raise_for_status()
        data = response.json()
        
        expires_in = data.get("expires_in", 3600)
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        return {
            "access_token": data["access_token"],
            "refresh_token": data.get("refresh_token"),
            "expires_at": expires_at,
            "email": await get_microsoft_email(data["access_token"]),
        }


async def refresh_google_token(refresh_token: str) -> Dict:
    """Refresh Google access token."""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise ValueError("Google OAuth credentials not configured")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "refresh_token": refresh_token,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "grant_type": "refresh_token",
            },
        )
        response.raise_for_status()
        data = response.json()
        
        expires_in = data.get("expires_in", 3600)
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        return {
            "access_token": data["access_token"],
            "expires_at": expires_at,
        }


async def refresh_microsoft_token(refresh_token: str) -> Dict:
    """Refresh Microsoft access token."""
    if not settings.MICROSOFT_CLIENT_ID or not settings.MICROSOFT_CLIENT_SECRET:
        raise ValueError("Microsoft OAuth credentials not configured")
    
    tenant = settings.MICROSOFT_TENANT_ID or "common"
    token_url = MICROSOFT_TOKEN_URL.format(tenant=tenant)
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            token_url,
            data={
                "refresh_token": refresh_token,
                "client_id": settings.MICROSOFT_CLIENT_ID,
                "client_secret": settings.MICROSOFT_CLIENT_SECRET,
                "grant_type": "refresh_token",
                "scope": " ".join(MICROSOFT_SCOPES),
            },
        )
        response.raise_for_status()
        data = response.json()
        
        expires_in = data.get("expires_in", 3600)
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        return {
            "access_token": data["access_token"],
            "expires_at": expires_at,
        }


async def get_google_email(access_token: str) -> str:
    """Get user's email from Google."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        return response.json()["email"]


async def get_microsoft_email(access_token: str) -> str:
    """Get user's email from Microsoft."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        return response.json()["mail"] or response.json()["userPrincipalName"]


def generate_xoauth2_string(email: str, access_token: str) -> str:
    """Generate XOAUTH2 authentication string for IMAP/SMTP."""
    auth_string = f"user={email}\x01auth=Bearer {access_token}\x01\x01"
    return base64.b64encode(auth_string.encode()).decode()


async def ensure_valid_token(
    provider: str,
    access_token: str,
    refresh_token: Optional[str],
    expires_at: Optional[datetime]
) -> Tuple[str, Optional[datetime]]:
    """
    Ensure access token is valid, refresh if needed.
    Returns (access_token, new_expires_at)
    """
    # Check if token is expired or about to expire (5 min buffer)
    if expires_at and datetime.utcnow() >= expires_at - timedelta(minutes=5):
        if not refresh_token:
            raise ValueError("Token expired and no refresh token available")
        
        logger.info(f"Refreshing {provider} access token")
        
        if provider == "google":
            result = await refresh_google_token(refresh_token)
        elif provider == "microsoft":
            result = await refresh_microsoft_token(refresh_token)
        else:
            raise ValueError(f"Unknown provider: {provider}")
        
        return result["access_token"], result["expires_at"]
    
    return access_token, expires_at


def get_oauth_smtp_settings(provider: str) -> Dict[str, any]:
    """Get SMTP settings for OAuth provider."""
    if provider == "google":
        return {
            "host": "smtp.gmail.com",
            "port": 587,
        }
    elif provider == "microsoft":
        return {
            "host": "smtp-mail.outlook.com",
            "port": 587,
        }
    else:
        raise ValueError(f"Unknown provider: {provider}")


def get_oauth_imap_settings(provider: str) -> Dict[str, any]:
    """Get IMAP settings for OAuth provider."""
    if provider == "google":
        return {
            "host": "imap.gmail.com",
            "port": 993,
        }
    elif provider == "microsoft":
        return {
            "host": "outlook.office365.com",
            "port": 993,
        }
    else:
        raise ValueError(f"Unknown provider: {provider}")
