from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app import deps
from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.smtp import SMTPConfig
from app.schemas.user import Token, UserCreate, User as UserSchema, OTPVerify, ForgotPasswordRequest, ResetPasswordRequest
from app.services import otp_service

router = APIRouter()

@router.post("/login")
async def login_access_token(
    db: AsyncSession = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    result = await db.execute(select(User).filter(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.email_verified:
        raise HTTPException(
            status_code=400, 
            detail="Email not verified. Please verify your email first."
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # If 2FA enabled, send OTP
    if user.two_factor_enabled:
        code = await otp_service.generate_otp(db, user.id, 'login')
        
        result = await db.execute(select(SMTPConfig).limit(1))
        smtp_config = result.scalars().first()
        
        if smtp_config:
            try:
                await otp_service.send_otp_email(smtp_config, user.email, code, 'login')
            except Exception as e:
                print(f"Failed to send OTP email: {e}")
        
        return {
            "message": "OTP sent to your email",
            "requires_otp": True,
            "user_id": user.id
        }
    
    # No 2FA, generate token directly
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            {"email": user.email}, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/verify-login", response_model=Token)
async def verify_login(
    otp_verify: OTPVerify,
    db: AsyncSession = Depends(get_db),
):
    """Login - Step 2: Verify OTP"""
    result = await db.execute(select(User).filter(User.id == otp_verify.user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    is_valid = await otp_service.verify_otp(db, user.id, otp_verify.code, 'login')
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            {"email": user.email}, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/register")
async def register_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    result = await db.execute(select(User).filter(User.email == user_in.email))
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_active=True,
        email_verified=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Generate and send OTP
    code = await otp_service.generate_otp(db, user.id, 'registration')
    
    # Get SMTP config (use first available)
    result = await db.execute(select(SMTPConfig).limit(1))
    smtp_config = result.scalars().first()
    
    if smtp_config:
        try:
            await otp_service.send_otp_email(smtp_config, user.email, code, 'registration')
        except Exception as e:
            print(f"Failed to send OTP email: {e}")
    
    return {
        "message": "Registration successful. Please check your email for verification code.",
        "user_id": user.id,
        "email": user.email,
        "requires_verification": True
    }

@router.post("/verify-email")
async def verify_email(
    otp_verify: OTPVerify,
    db: AsyncSession = Depends(get_db),
):
    """Verify email with OTP"""
    result = await db.execute(select(User).filter(User.id == otp_verify.user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    is_valid = await otp_service.verify_otp(db, user.id, otp_verify.code, 'registration')
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    user.email_verified = True
    await db.commit()
    
    return {"message": "Email verified successfully. You can now login."}

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Request password reset OTP"""
    result = await db.execute(select(User).filter(User.email == request.email))
    user = result.scalars().first()
    
    if not user:
        # Don't reveal if email exists
        return {"message": "If email exists, OTP has been sent"}
    
    code = await otp_service.generate_otp(db, user.id, 'password_reset')
    
    result = await db.execute(select(SMTPConfig).limit(1))
    smtp_config = result.scalars().first()
    
    if smtp_config:
        try:
            await otp_service.send_otp_email(smtp_config, user.email, code, 'password_reset')
        except Exception as e:
            print(f"Failed to send OTP email: {e}")
    
    return {
        "message": "If email exists, OTP has been sent",
        "user_id": user.id if user else None
    }

@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Reset password with OTP"""
    result = await db.execute(select(User).filter(User.id == request.user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    is_valid = await otp_service.verify_otp(db, user.id, request.code, 'password_reset')
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    user.hashed_password = security.get_password_hash(request.new_password)
    await db.commit()
    
    return {"message": "Password reset successfully"}

@router.get("/me", response_model=UserSchema)
async def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return current_user
