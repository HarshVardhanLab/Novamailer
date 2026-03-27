"""
OAuth 2.0 authentication router for Gmail and Microsoft.
Handles authorization flow and token management.
"""
import secrets
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app import deps
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.smtp import SMTPConfig
from app.models.imap_config import IMAPConfig
from app.services import oauth_service

router = APIRouter()

# In-memory state storage (use Redis in production)
oauth_states = {}


class OAuthInitRequest(BaseModel):
    provider: str  # "google" or "microsoft"


class OAuthCallbackData(BaseModel):
    provider: str
    code: str
    state: str


@router.get("/config")
async def get_oauth_config():
    """Return OAuth configuration status."""
    return {
        "google": {
            "enabled": bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET),
            "client_id": settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None,
        },
        "microsoft": {
            "enabled": bool(settings.MICROSOFT_CLIENT_ID and settings.MICROSOFT_CLIENT_SECRET),
            "client_id": settings.MICROSOFT_CLIENT_ID if settings.MICROSOFT_CLIENT_ID else None,
        },
    }


@router.post("/init")
async def init_oauth(
    request: OAuthInitRequest,
    current_user: User = Depends(deps.get_current_user),
):
    """Initialize OAuth flow and return authorization URL."""
    provider = request.provider.lower()
    
    if provider not in ["google", "microsoft"]:
        raise HTTPException(status_code=400, detail="Invalid provider")
    
    # Generate state token
    state = secrets.token_urlsafe(32)
    oauth_states[state] = {
        "user_id": current_user.id,
        "provider": provider,
    }
    
    # Build redirect URI - use backend URL since frontend is on same domain
    # The callback will redirect to frontend after processing
    backend_url = settings.FRONTEND_URL.replace("http://localhost:3000", "http://localhost:8000")
    redirect_uri = f"{backend_url}/api/v1/oauth/callback"
    
    # Get authorization URL
    try:
        if provider == "google":
            if not settings.GOOGLE_CLIENT_ID:
                raise HTTPException(
                    status_code=400,
                    detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
                )
            auth_url = oauth_service.get_google_auth_url(redirect_uri, state)
        else:  # microsoft
            if not settings.MICROSOFT_CLIENT_ID:
                raise HTTPException(
                    status_code=400,
                    detail="Microsoft OAuth not configured. Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET."
                )
            auth_url = oauth_service.get_microsoft_auth_url(redirect_uri, state)
        
        return {"auth_url": auth_url, "state": state}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/callback")
async def oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    error: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Handle OAuth callback and exchange code for tokens."""
    
    # Check for errors
    if error:
        # For desktop app, return JSON instead of redirect
        return {
            "success": False,
            "error": error,
            "message": f"OAuth error: {error}"
        }
    
    # Verify state
    if state not in oauth_states:
        return {
            "success": False,
            "error": "invalid_state",
            "message": "Invalid or expired state token"
        }
    
    state_data = oauth_states.pop(state)
    user_id = state_data["user_id"]
    provider = state_data["provider"]
    
    try:
        # Determine redirect URI based on environment
        if "localhost" in settings.FRONTEND_URL or "127.0.0.1" in settings.FRONTEND_URL:
            backend_url = settings.FRONTEND_URL.replace(":3000", ":8000")
            redirect_uri = f"{backend_url}/api/v1/oauth/callback"
        else:
            redirect_uri = f"{settings.FRONTEND_URL}/api/oauth/callback"
        
        # Exchange code for tokens
        if provider == "google":
            token_data = await oauth_service.exchange_google_code(code, redirect_uri)
        else:  # microsoft
            token_data = await oauth_service.exchange_microsoft_code(code, redirect_uri)
        
        # Get provider settings
        smtp_settings = oauth_service.get_oauth_smtp_settings(provider)
        imap_settings = oauth_service.get_oauth_imap_settings(provider)
        
        email = token_data["email"]
        access_token = token_data["access_token"]
        refresh_token = token_data.get("refresh_token")
        expires_at = token_data["expires_at"]
        
        # Save SMTP config
        result = await db.execute(select(SMTPConfig).filter(SMTPConfig.user_id == user_id))
        smtp_config = result.scalars().first()
        
        if smtp_config:
            smtp_config.host = smtp_settings["host"]
            smtp_config.port = smtp_settings["port"]
            smtp_config.username = email
            smtp_config.from_email = email
            smtp_config.auth_type = "oauth"
            smtp_config.oauth_provider = provider
            smtp_config.oauth_access_token = access_token
            if refresh_token:
                smtp_config.oauth_refresh_token = refresh_token
            smtp_config.oauth_token_expires_at = expires_at
            smtp_config.password = ""  # Clear password when using OAuth
        else:
            smtp_config = SMTPConfig(
                host=smtp_settings["host"],
                port=smtp_settings["port"],
                username=email,
                password="",  # No password for OAuth
                from_email=email,
                auth_type="oauth",
                oauth_provider=provider,
                oauth_access_token=access_token,
                oauth_refresh_token=refresh_token,
                oauth_token_expires_at=expires_at,
                user_id=user_id,
            )
            db.add(smtp_config)
        
        # Save IMAP config
        result = await db.execute(select(IMAPConfig).filter(IMAPConfig.user_id == user_id))
        imap_config = result.scalars().first()
        
        if imap_config:
            imap_config.host = imap_settings["host"]
            imap_config.port = imap_settings["port"]
            imap_config.username = email
            imap_config.auth_type = "oauth"
            imap_config.oauth_provider = provider
            imap_config.oauth_access_token = access_token
            if refresh_token:
                imap_config.oauth_refresh_token = refresh_token
            imap_config.oauth_token_expires_at = expires_at
            imap_config.password = ""  # Clear password when using OAuth
        else:
            imap_config = IMAPConfig(
                host=imap_settings["host"],
                port=imap_settings["port"],
                username=email,
                password="",  # No password for OAuth
                auth_type="oauth",
                oauth_provider=provider,
                oauth_access_token=access_token,
                oauth_refresh_token=refresh_token,
                oauth_token_expires_at=expires_at,
                user_id=user_id,
            )
            db.add(imap_config)
        
        await db.commit()
        
        # For desktop app, return JSON response with success page HTML
        html_response = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>OAuth Success</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }}
                .container {{
                    background: white;
                    padding: 3rem;
                    border-radius: 1rem;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    text-align: center;
                    max-width: 400px;
                }}
                .success-icon {{
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }}
                h1 {{
                    color: #10b981;
                    margin: 0 0 1rem 0;
                }}
                p {{
                    color: #6b7280;
                    margin: 0 0 2rem 0;
                }}
                .provider {{
                    display: inline-block;
                    padding: 0.5rem 1rem;
                    background: #f3f4f6;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    color: #374151;
                }}
                .close-btn {{
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 0.5rem;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background 0.2s;
                }}
                .close-btn:hover {{
                    background: #5568d3;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success-icon">✓</div>
                <h1>Successfully Connected!</h1>
                <p>Your email account has been connected via OAuth.</p>
                <div class="provider">{provider.title()}</div>
                <p style="margin-top: 1.5rem; font-size: 0.875rem;">
                    Both SMTP and IMAP are now configured.<br>
                    You can close this window.
                </p>
                <button class="close-btn" onclick="window.close()">Close Window</button>
            </div>
            <script>
                // Auto-close after 3 seconds
                setTimeout(() => window.close(), 3000);
                
                // Try to communicate with parent window (for desktop app)
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: 'oauth_success',
                        provider: '{provider}'
                    }}, '*');
                }}
            </script>
        </body>
        </html>
        """
        
        from fastapi.responses import HTMLResponse
        return HTMLResponse(content=html_response)
        
    except Exception as e:
        error_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>OAuth Error</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                }}
                .container {{
                    background: white;
                    padding: 3rem;
                    border-radius: 1rem;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    text-align: center;
                    max-width: 400px;
                }}
                .error-icon {{
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }}
                h1 {{
                    color: #ef4444;
                    margin: 0 0 1rem 0;
                }}
                p {{
                    color: #6b7280;
                    margin: 0 0 2rem 0;
                }}
                .error-details {{
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    color: #991b1b;
                    margin-bottom: 1.5rem;
                }}
                .close-btn {{
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 0.5rem;
                    font-size: 1rem;
                    cursor: pointer;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="error-icon">✗</div>
                <h1>Connection Failed</h1>
                <p>Unable to connect your email account.</p>
                <div class="error-details">{str(e)}</div>
                <button class="close-btn" onclick="window.close()">Close Window</button>
            </div>
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: 'oauth_error',
                        error: '{str(e)}'
                    }}, '*');
                }}
            </script>
        </body>
        </html>
        """
        
        from fastapi.responses import HTMLResponse
        return HTMLResponse(content=error_html, status_code=400)


@router.post("/disconnect")
async def disconnect_oauth(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Disconnect OAuth and clear tokens."""
    
    # Clear SMTP OAuth
    result = await db.execute(select(SMTPConfig).filter(SMTPConfig.user_id == current_user.id))
    smtp_config = result.scalars().first()
    if smtp_config and smtp_config.auth_type == "oauth":
        smtp_config.auth_type = "password"
        smtp_config.oauth_provider = None
        smtp_config.oauth_access_token = ""
        smtp_config.oauth_refresh_token = ""
        smtp_config.oauth_token_expires_at = None
    
    # Clear IMAP OAuth
    result = await db.execute(select(IMAPConfig).filter(IMAPConfig.user_id == current_user.id))
    imap_config = result.scalars().first()
    if imap_config and imap_config.auth_type == "oauth":
        imap_config.auth_type = "password"
        imap_config.oauth_provider = None
        imap_config.oauth_access_token = ""
        imap_config.oauth_refresh_token = ""
        imap_config.oauth_token_expires_at = None
    
    await db.commit()
    
    return {"success": True, "message": "OAuth disconnected"}
