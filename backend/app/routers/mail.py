"""
Mail management router — full IMAP client API.
IMAP credentials are passed per-request (never stored server-side).
"""
import imaplib
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Body, Query
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app import deps
from app.core.database import get_db
from app.models.smtp import SMTPConfig
from app.models.user import User
from app.services import imap_service

router = APIRouter()


# ── shared credential schema ──────────────────────────────────────────────────

class IMAPCreds(BaseModel):
    host: str
    port: int = 993
    username: str
    password: str


class IMAPCredsWithFolder(IMAPCreds):
    folder: str = "INBOX"


# ── connect / folder list ─────────────────────────────────────────────────────

@router.post("/connect")
async def connect_imap(
    creds: IMAPCreds,
    current_user: User = Depends(deps.get_current_user),
):
    """Validate IMAP credentials and return folder list."""
    try:
        # Validate inputs
        if not creds.host or len(creds.host) > 255:
            raise HTTPException(status_code=400, detail="Invalid host")
        if not 1 <= creds.port <= 65535:
            raise HTTPException(status_code=400, detail="Invalid port")
        if not creds.username or len(creds.username) > 255:
            raise HTTPException(status_code=400, detail="Invalid username")
        
        folders = await imap_service.list_folders(
            creds.host, creds.port, creds.username, creds.password
        )
        return {"success": True, "folders": folders}
    except HTTPException:
        raise
    except imaplib.IMAP4.error as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
    except TimeoutError:
        raise HTTPException(status_code=504, detail="Connection timeout. Please check your server settings.")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"IMAP error: {str(e)}")


@router.post("/folders")
async def get_folders(
    creds: IMAPCreds,
    current_user: User = Depends(deps.get_current_user),
):
    """Return folder list with unread counts."""
    try:
        folders = await imap_service.list_folders(
            creds.host, creds.port, creds.username, creds.password
        )
        return {"folders": folders}
    except imaplib.IMAP4.error as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"IMAP error: {str(e)}")


# ── message list ──────────────────────────────────────────────────────────────

class MessagesRequest(IMAPCreds):
    folder: str = "INBOX"
    page: int = 1
    per_page: int = 25
    search: str = ""


@router.post("/messages")
async def get_messages(
    req: MessagesRequest,
    current_user: User = Depends(deps.get_current_user),
):
    """Return paginated email list for a folder."""
    try:
        result = await imap_service.get_messages(
            req.host, req.port, req.username, req.password,
            req.folder, req.page, req.per_page, req.search,
        )
        return result
    except imaplib.IMAP4.error as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"IMAP error: {str(e)}")


# ── message detail ────────────────────────────────────────────────────────────

class MessageDetailRequest(IMAPCreds):
    folder: str = "INBOX"
    uid: str


@router.post("/message")
async def get_message(
    req: MessageDetailRequest,
    current_user: User = Depends(deps.get_current_user),
):
    """Return full email detail including body and attachments."""
    try:
        detail = await imap_service.get_message_detail(
            req.host, req.port, req.username, req.password,
            req.folder, req.uid,
        )
        return detail
    except imaplib.IMAP4.error as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"IMAP error: {str(e)}")


# ── attachment download ───────────────────────────────────────────────────────

class AttachmentRequest(IMAPCreds):
    folder: str
    uid: str
    part_id: str


@router.post("/attachment")
async def get_attachment(
    req: AttachmentRequest,
    current_user: User = Depends(deps.get_current_user),
):
    """Return raw attachment bytes."""
    try:
        result = await imap_service.get_attachment(
            req.host, req.port, req.username, req.password,
            req.folder, req.uid, req.part_id,
        )
        if not result:
            raise HTTPException(status_code=404, detail="Attachment not found")
        data, content_type, filename = result
        return Response(
            content=data,
            media_type=content_type,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"IMAP error: {str(e)}")


# ── flags ─────────────────────────────────────────────────────────────────────

class FlagsRequest(IMAPCreds):
    folder: str
    uid: str
    add_flags: List[str] = []
    remove_flags: List[str] = []


@router.post("/flags")
async def update_flags(
    req: FlagsRequest,
    current_user: User = Depends(deps.get_current_user),
):
    """Set or unset IMAP flags (\\Seen, \\Flagged, etc.)."""
    try:
        await imap_service.set_flags(
            req.host, req.port, req.username, req.password,
            req.folder, req.uid, req.add_flags, req.remove_flags,
        )
        return {"success": True}
    except imaplib.IMAP4.error as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"IMAP error: {str(e)}")


# ── move ──────────────────────────────────────────────────────────────────────

class MoveRequest(IMAPCreds):
    folder: str
    uid: str
    destination: str


@router.post("/move")
async def move_message(
    req: MoveRequest,
    current_user: User = Depends(deps.get_current_user),
):
    """Move an email to a different folder."""
    try:
        await imap_service.move_message(
            req.host, req.port, req.username, req.password,
            req.folder, req.uid, req.destination,
        )
        return {"success": True}
    except imaplib.IMAP4.error as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"IMAP error: {str(e)}")


# ── delete ────────────────────────────────────────────────────────────────────

class DeleteRequest(IMAPCreds):
    folder: str
    uid: str
    trash_folder: str = "Trash"


@router.post("/delete")
async def delete_message(
    req: DeleteRequest,
    current_user: User = Depends(deps.get_current_user),
):
    """Move to trash or permanently delete if already in trash."""
    try:
        await imap_service.delete_message(
            req.host, req.port, req.username, req.password,
            req.folder, req.uid, req.trash_folder,
        )
        return {"success": True}
    except imaplib.IMAP4.error as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"IMAP error: {str(e)}")


# ── send / reply / forward ────────────────────────────────────────────────────

class SendRequest(BaseModel):
    to: str
    cc: str = ""
    bcc: str = ""
    subject: str
    body: str
    in_reply_to: str = ""
    references: str = ""


@router.post("/send")
async def send_mail(
    req: SendRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Send email via saved SMTP config with optional reply headers."""
    result = await db.execute(select(SMTPConfig).filter(SMTPConfig.user_id == current_user.id))
    smtp_config = result.scalars().first()
    if not smtp_config:
        raise HTTPException(status_code=400, detail="No SMTP configuration found. Configure it in Settings first.")

    import aiosmtplib
    import ssl
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    msg = MIMEMultipart("alternative")
    msg["From"] = smtp_config.from_email
    msg["To"] = req.to
    if req.cc:
        msg["Cc"] = req.cc
    msg["Subject"] = req.subject
    if req.in_reply_to:
        msg["In-Reply-To"] = req.in_reply_to
        msg["References"] = req.references or req.in_reply_to

    msg.attach(MIMEText(req.body, "html"))

    try:
        password = smtp_config.password.replace(" ", "")
        tls_ctx = ssl.create_default_context()
        tls_ctx.check_hostname = False
        tls_ctx.verify_mode = ssl.CERT_NONE

        use_tls = smtp_config.port == 465
        start_tls = smtp_config.port in (587, 25)

        all_recipients = [r.strip() for r in (req.to + "," + req.cc + "," + req.bcc).split(",") if r.strip()]

        smtp = aiosmtplib.SMTP(
            hostname=smtp_config.host,
            port=smtp_config.port,
            use_tls=use_tls,
            tls_context=tls_ctx if use_tls else None,
            timeout=30,
        )
        await smtp.connect()
        if start_tls:
            await smtp.starttls(tls_context=tls_ctx)
        await smtp.login(smtp_config.username, password)
        await smtp.sendmail(smtp_config.from_email, all_recipients, msg.as_string())
        await smtp.quit()

        return {"success": True, "message": f"Email sent to {req.to}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send: {str(e)}")
