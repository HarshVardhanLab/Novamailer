import aiosmtplib
import ssl
import re
from email.message import EmailMessage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict
from app.models.smtp import SMTPConfig


def inject_tracking(body: str, tracking_id: str, base_url: str, unsubscribe_url: str) -> str:
    """Inject open-tracking pixel, click-tracking links, and unsubscribe footer."""
    # Wrap links for click tracking
    def replace_link(match):
        original_url = match.group(1)
        # Don't wrap tracking/unsubscribe links
        if "track" in original_url or "unsubscribe" in original_url:
            return match.group(0)
        tracked = f"{base_url}/track/click/{tracking_id}?url={original_url}"
        return f'href="{tracked}"'

    body = re.sub(r'href="(https?://[^"]+)"', replace_link, body)

    # Inject open-tracking pixel before </body>
    pixel = f'<img src="{base_url}/track/open/{tracking_id}" width="1" height="1" style="display:none" />'
    unsub_footer = (
        f'<div style="margin-top:20px;font-size:11px;color:#999;text-align:center;">'
        f'<a href="{unsubscribe_url}">Unsubscribe</a></div>'
    )

    if "</body>" in body.lower():
        body = re.sub(r"</body>", f"{pixel}{unsub_footer}</body>", body, flags=re.IGNORECASE)
    else:
        body += pixel + unsub_footer

    return body


async def send_email(
    smtp_config: SMTPConfig,
    to_email: str,
    subject: str,
    body: str,
    attachments: Optional[List[Dict]] = None,
    tracking_id: Optional[str] = None,
    base_url: str = "http://localhost:8000/api/v1",
    unsubscribe_url: Optional[str] = None,
):
    """Send email via SMTP with optional attachments and tracking."""
    try:
        if tracking_id:
            unsub = unsubscribe_url or f"{base_url}/unsubscribe/{tracking_id}"
            body = inject_tracking(body, tracking_id, base_url, unsub)

        if attachments:
            message = MIMEMultipart()
            message["From"] = smtp_config.from_email
            message["To"] = to_email
            message["Subject"] = subject
            message.attach(MIMEText(body, "html"))

            for attachment in attachments:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(attachment["data"])
                encoders.encode_base64(part)
                part.add_header("Content-Disposition", f"attachment; filename= {attachment['filename']}")
                if "content_type" in attachment:
                    part.replace_header("Content-Type", attachment["content_type"])
                message.attach(part)
        else:
            message = EmailMessage()
            message["From"] = smtp_config.from_email
            message["To"] = to_email
            message["Subject"] = subject
            message.set_content(body, subtype="html")

        password = smtp_config.password.replace(" ", "")

        tls_context = ssl.create_default_context()
        tls_context.check_hostname = False
        tls_context.verify_mode = ssl.CERT_NONE

        use_tls = smtp_config.port == 465
        start_tls = smtp_config.port == 587

        await aiosmtplib.send(
            message,
            hostname=smtp_config.host,
            port=smtp_config.port,
            username=smtp_config.username,
            password=password,
            use_tls=use_tls,
            start_tls=start_tls,
            tls_context=tls_context,
            timeout=30,
        )
        print(f"✅ Email sent to {to_email}")

    except Exception as e:
        print(f"❌ Email send failed: {type(e).__name__}: {str(e)}")
        raise
