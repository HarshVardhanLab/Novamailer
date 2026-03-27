from typing import Union
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app import deps
from app.core.database import get_db
from app.models.smtp import SMTPConfig
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

        use_tls = smtp_config.port == 465
        start_tls = smtp_config.port == 587

        smtp = aiosmtplib.SMTP(
            hostname=smtp_config.host,
            port=smtp_config.port,
            use_tls=use_tls,
            tls_context=tls_context,
            timeout=10,
        )
        await smtp.connect()
        if start_tls:
            await smtp.starttls(tls_context=tls_context)
        await smtp.login(smtp_config.username, password)
        await smtp.quit()

        return {"success": True, "message": f"Connected to {smtp_config.host}:{smtp_config.port} successfully"}
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
