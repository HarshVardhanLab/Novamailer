import aiosmtplib
import ssl
from email.message import EmailMessage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict
from app.models.smtp import SMTPConfig

async def send_email(
    smtp_config: SMTPConfig, 
    to_email: str, 
    subject: str, 
    body: str,
    attachments: Optional[List[Dict]] = None
):
    """
    Send email via SMTP with optional attachments
    
    Args:
        smtp_config: SMTP configuration
        to_email: Recipient email
        subject: Email subject
        body: HTML email body
        attachments: List of dicts with keys: filename, content_type, data (bytes)
    """
    try:
        # Create message
        if attachments:
            # Use MIME multipart for attachments
            message = MIMEMultipart()
            message["From"] = smtp_config.from_email
            message["To"] = to_email
            message["Subject"] = subject
            
            # Add HTML body
            html_part = MIMEText(body, "html")
            message.attach(html_part)
            
            # Add attachments
            for attachment in attachments:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(attachment["data"])
                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition",
                    f"attachment; filename= {attachment['filename']}"
                )
                if "content_type" in attachment:
                    part.replace_header("Content-Type", attachment["content_type"])
                message.attach(part)
                
            print(f"   📎 {len(attachments)} attachment(s) added")
        else:
            # Simple email without attachments
            message = EmailMessage()
            message["From"] = smtp_config.from_email
            message["To"] = to_email
            message["Subject"] = subject
            message.set_content(body, subtype="html")

        # Remove spaces from password (Gmail app passwords have spaces but SMTP doesn't need them)
        password = smtp_config.password.replace(" ", "")

        print(f"📧 Attempting to send email to {to_email}")
        print(f"   Host: {smtp_config.host}:{smtp_config.port}")
        print(f"   Username: {smtp_config.username}")

        # Create SSL context that doesn't verify certificates (for development)
        tls_context = ssl.create_default_context()
        tls_context.check_hostname = False
        tls_context.verify_mode = ssl.CERT_NONE

        await aiosmtplib.send(
            message,
            hostname=smtp_config.host,
            port=smtp_config.port,
            username=smtp_config.username,
            password=password,
            start_tls=True,
            tls_context=tls_context,
        )
        
        print(f"✅ Email sent successfully to {to_email}")
        
    except Exception as e:
        print(f"❌ Email send failed: {type(e).__name__}: {str(e)}")
        raise
