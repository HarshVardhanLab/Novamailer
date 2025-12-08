import random
import string
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.otp import OTP
from app.services import email as email_service

async def generate_otp(db: AsyncSession, user_id: int, purpose: str) -> str:
    """Generate a 6-digit OTP code"""
    code = ''.join(random.choices(string.digits, k=6))
    # Store as naive datetime for SQLite compatibility
    expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=10)  # 10 min expiry
    
    # Invalidate old OTPs for this user and purpose
    result = await db.execute(
        select(OTP).filter(
            OTP.user_id == user_id,
            OTP.purpose == purpose,
            OTP.used == False
        )
    )
    old_otps = result.scalars().all()
    for old_otp in old_otps:
        old_otp.used = True
    
    # Create new OTP
    otp = OTP(
        user_id=user_id,
        code=code,
        purpose=purpose,
        expires_at=expires_at
    )
    db.add(otp)
    await db.commit()
    
    return code

async def verify_otp(db: AsyncSession, user_id: int, code: str, purpose: str) -> bool:
    """Verify OTP code"""
    result = await db.execute(
        select(OTP).filter(
            OTP.user_id == user_id,
            OTP.code == code,
            OTP.purpose == purpose,
            OTP.used == False
        ).order_by(OTP.created_at.desc())
    )
    otp = result.scalars().first()
    
    if not otp:
        return False
    
    if not otp.is_valid():
        return False
    
    # Mark as used
    otp.used = True
    await db.commit()
    
    return True

async def send_otp_email(smtp_config, to_email: str, code: str, purpose: str):
    """Send OTP via email"""
    purpose_text = {
        'registration': 'Email Verification',
        'login': 'Login Verification',
        'password_reset': 'Password Reset'
    }
    
    subject = f"{purpose_text.get(purpose, 'Verification')} - Your OTP Code"
    
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">{purpose_text.get(purpose, 'Verification')}</h2>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #374151;">Your verification code is:</p>
            <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <h1 style="margin: 0; letter-spacing: 8px; color: #4F46E5; font-size: 32px;">
                    {code}
                </h1>
            </div>
            <p style="font-size: 14px; color: #6b7280;">
                This code will expire in <strong>10 minutes</strong>.
            </p>
            <p style="font-size: 14px; color: #6b7280;">
                If you didn't request this code, please ignore this email.
            </p>
        </div>
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
            <p>© 2024 NovaMailer. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    
    await email_service.send_email(smtp_config, to_email, subject, body)
