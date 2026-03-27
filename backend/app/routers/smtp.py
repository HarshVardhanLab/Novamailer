from typing import Union
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app import deps
from app.core.database import get_db
from app.models.smtp import SMTPConfig
from app.models.imap_config import IMAPConfig as IMAPConfigModel
from app.models.user import User
from app.schemas.smtp import SMTPConfigCreate, SMTPConfigUpdate, SMTPConfig as SMTPConfigSchema

router = APIRouter()


@router.post("/", response_model=SMTPConfigSchema)
async def create_or_update_smtp(
    smtp_data: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(select(SMTPConfig).filter(SMTPConfig.user_id == current_user.id))
    smtp_config = result.scalars().first()

    if smtp_config:
        for key, value in smtp_data.items():
            if key == "password" and (value is None or value == ""):
                continue
            if hasattr(smtp_config, key):
                setattr(smtp_config, key, value)
    else:
        if "password" not in smtp_data or not smtp_data["password"]:
            raise HTTPException(status_code=400, detail="Password is required for new SMTP configuration")
        smtp_config = SMTPConfig(**smtp_data, user_id=current_user.id)
        db.add(smtp_config)

    await db.commit()
    await db.refresh(smtp_config)
    return smtp_config


@router.get("/", response_model=SMTPConfigSchema)
async def read_smtp(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(select(SMTPConfig).filter(SMTPConfig.user_id == current_user.id))
    smtp_config = result.scalars().first()
    if smtp_config is None:
        raise HTTPException(status_code=404, detail="SMTP Config not found")
    return smtp_config


@router.post("/test")
async def test_smtp_connection(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Test the saved SMTP configuration by opening a real connection."""
    result = await db.execute(select(SMTPConfig).filter(SMTPConfig.user_id == current_user.id))
    smtp_config = result.scalars().first()
    if not smtp_config:
        raise HTTPException(status_code=404, detail="No SMTP configuration found. Save settings first.")

    import aiosmtplib
    import ssl

    try:
        password = smtp_config.password.replace(" ", "")
        tls_context = ssl.create_default_context()
        tls_context.check_hostname = False
        tls_context.verify_mode = ssl.CERT_NONE

        port = smtp_config.port
        # Port 465 = implicit TLS (connect already encrypted, no STARTTLS)
        # Port 587/25 = STARTTLS (plain connect, then upgrade)
        use_tls = port == 465
        start_tls = port in (587, 25)

        smtp = aiosmtplib.SMTP(
            hostname=smtp_config.host,
            port=port,
            use_tls=use_tls,
            tls_context=tls_context if use_tls else None,
            timeout=15,
        )
        await smtp.connect()
        if start_tls:
            await smtp.starttls(tls_context=tls_context)
        await smtp.login(smtp_config.username, password)
        await smtp.quit()

        return {"success": True, "message": f"✅ Connected to {smtp_config.host}:{port} successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Connection failed: {str(e)}")


# ── IMAP inbox ────────────────────────────────────────────────────────────────

class IMAPConfig(BaseModel):
    host: str
    port: int = 993
    username: str
    password: str


@router.post("/inbox")
async def fetch_inbox(
    imap: IMAPConfig,
    current_user: User = Depends(deps.get_current_user),
):
    """Fetch recent emails from an IMAP inbox."""
    import asyncio
    import imaplib
    import email as email_lib
    from email.header import decode_header

    def _fetch():
        password = imap.password.replace(" ", "")
        try:
            mail = imaplib.IMAP4_SSL(imap.host, imap.port)
        except Exception:
            mail = imaplib.IMAP4(imap.host, imap.port)
            mail.starttls()

        mail.login(imap.username, password)
        mail.select("INBOX")

        _, data = mail.search(None, "ALL")
        ids = data[0].split()
        # Fetch latest 20
        recent = ids[-20:] if len(ids) > 20 else ids
        recent = list(reversed(recent))

        messages = []
        for uid in recent:
            _, msg_data = mail.fetch(uid, "(RFC822)")
            raw = msg_data[0][1]
            msg = email_lib.message_from_bytes(raw)

            # Decode subject
            subject_raw, enc = decode_header(msg["Subject"] or "")[0]
            if isinstance(subject_raw, bytes):
                subject = subject_raw.decode(enc or "utf-8", errors="replace")
            else:
                subject = subject_raw or "(no subject)"

            # Decode from
            from_raw, enc2 = decode_header(msg["From"] or "")[0]
            if isinstance(from_raw, bytes):
                from_addr = from_raw.decode(enc2 or "utf-8", errors="replace")
            else:
                from_addr = from_raw or ""

            # Get body
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    ct = part.get_content_type()
                    if ct == "text/html":
                        body = part.get_payload(decode=True).decode(errors="replace")
                        break
                    elif ct == "text/plain" and not body:
                        body = part.get_payload(decode=True).decode(errors="replace")
            else:
                body = msg.get_payload(decode=True).decode(errors="replace")

            messages.append({
                "id": uid.decode(),
                "subject": subject,
                "from": from_addr,
                "date": msg["Date"] or "",
                "body": body[:5000],  # cap at 5KB
                "is_read": "\\Seen" in (msg.get("Flags", "") or ""),
            })

        mail.logout()
        return messages

    try:
        messages = await asyncio.get_event_loop().run_in_executor(None, _fetch)
        return {"messages": messages, "total": len(messages)}
    except imaplib.IMAP4.error as e:
        raise HTTPException(status_code=401, detail=f"IMAP authentication failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch inbox: {str(e)}")


@router.post("/inbox/send-reply")
async def send_reply(
    reply: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Send a reply email using saved SMTP config."""
    result = await db.execute(select(SMTPConfig).filter(SMTPConfig.user_id == current_user.id))
    smtp_config = result.scalars().first()
    if not smtp_config:
        raise HTTPException(status_code=404, detail="No SMTP configuration found")

    to_email = reply.get("to")
    subject = reply.get("subject", "")
    body = reply.get("body", "")

    if not to_email or not body:
        raise HTTPException(status_code=400, detail="to and body are required")

    from app.services.email import send_email
    try:
        await send_email(smtp_config, to_email, subject, body)
        return {"success": True, "message": f"Reply sent to {to_email}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send reply: {str(e)}")


# ── IMAP config (saved to DB) ─────────────────────────────────────────────────

class IMAPConfigSchema(BaseModel):
    host: str
    port: int = 993
    username: str
    password: str = ""
    
    class Config:
        str_strip_whitespace = True
        
    def validate_host(self):
        """Validate host format"""
        if not self.host or len(self.host) > 255:
            raise ValueError("Invalid host")
        return self
    
    def validate_port(self):
        """Validate port range"""
        if not 1 <= self.port <= 65535:
            raise ValueError("Port must be between 1 and 65535")
        return self


@router.get("/imap")
async def get_imap_config(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(select(IMAPConfigModel).filter(IMAPConfigModel.user_id == current_user.id))
    cfg = result.scalars().first()
    if not cfg:
        raise HTTPException(status_code=404, detail="No IMAP config saved")
    # Never return the password — frontend will use what's in DB directly via /imap/creds
    return {"host": cfg.host, "port": cfg.port, "username": cfg.username, "has_password": True}


@router.post("/imap")
async def save_imap_config(
    data: IMAPConfigSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(select(IMAPConfigModel).filter(IMAPConfigModel.user_id == current_user.id))
    cfg = result.scalars().first()
    if cfg:
        cfg.host = data.host
        cfg.port = data.port
        cfg.username = data.username
        if data.password:
            cfg.password = data.password
    else:
        if not data.password:
            raise HTTPException(status_code=400, detail="Password is required")
        cfg = IMAPConfigModel(host=data.host, port=data.port, username=data.username, password=data.password, user_id=current_user.id)
        db.add(cfg)
    await db.commit()
    return {"success": True, "message": "IMAP configuration saved"}


@router.post("/imap/test")
async def test_imap_config(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Test the saved IMAP configuration."""
    result = await db.execute(select(IMAPConfigModel).filter(IMAPConfigModel.user_id == current_user.id))
    cfg = result.scalars().first()
    if not cfg:
        raise HTTPException(status_code=404, detail="No IMAP config saved. Save it first.")

    import imaplib, ssl, asyncio
    
    def _test_connection():
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        mail = imaplib.IMAP4_SSL(cfg.host, cfg.port, ssl_context=ctx, timeout=10)
        mail.login(cfg.username, cfg.password.replace(" ", ""))
        mail.logout()
        return True
    
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _test_connection)
        return {"success": True, "message": f"✅ Connected to {cfg.host}:{cfg.port} successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"IMAP connection failed: {str(e)}")


@router.get("/imap/creds")
async def get_imap_creds(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Return full IMAP credentials for use by the mail client (authenticated endpoint)."""
    result = await db.execute(select(IMAPConfigModel).filter(IMAPConfigModel.user_id == current_user.id))
    cfg = result.scalars().first()
    if not cfg:
        raise HTTPException(status_code=404, detail="No IMAP config saved")
    return {"host": cfg.host, "port": cfg.port, "username": cfg.username, "password": cfg.password}


@router.get("/health")
async def health_check(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Health check endpoint - verify SMTP and IMAP configurations exist and are valid."""
    health = {
        "smtp": {"configured": False, "valid": False},
        "imap": {"configured": False, "valid": False},
    }
    
    # Check SMTP
    try:
        result = await db.execute(select(SMTPConfig).filter(SMTPConfig.user_id == current_user.id))
        smtp = result.scalars().first()
        if smtp:
            health["smtp"]["configured"] = True
            # Basic validation
            if smtp.host and smtp.port and smtp.username and smtp.password and smtp.from_email:
                health["smtp"]["valid"] = True
    except Exception:
        pass
    
    # Check IMAP
    try:
        result = await db.execute(select(IMAPConfigModel).filter(IMAPConfigModel.user_id == current_user.id))
        imap = result.scalars().first()
        if imap:
            health["imap"]["configured"] = True
            if imap.host and imap.port and imap.username and imap.password:
                health["imap"]["valid"] = True
    except Exception:
        pass
    
    return health
