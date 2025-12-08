# This file makes the directory a Python package
from app.models.user import User
from app.models.smtp import SMTPConfig
from app.models.campaign import Campaign
from app.models.template import Template
from app.models.recipient import Recipient
from app.models.otp import OTP

__all__ = ["User", "SMTPConfig", "Campaign", "Template", "Recipient", "OTP"]
