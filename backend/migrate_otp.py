"""
Migration script to add OTP table and update User model
Run this once to update your database schema
"""
import asyncio
from sqlalchemy import text
from app.core.database import engine, Base
from app.models.user import User
from app.models.otp import OTP

async def migrate():
    async with engine.begin() as conn:
        # Create OTP table
        await conn.run_sync(Base.metadata.create_all)
        
        # Add new columns to users table (SQLite doesn't support IF NOT EXISTS)
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE"))
            print("✓ Added email_verified column")
        except Exception as e:
            print(f"⚠ email_verified column might already exist")
        
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE"))
            print("✓ Added two_factor_enabled column")
        except Exception as e:
            print(f"⚠ two_factor_enabled column might already exist")
        
        await conn.commit()
        print("\n✅ Migration completed successfully!")
        print("\nNew features available:")
        print("  • Email verification with OTP")
        print("  • Two-factor authentication (2FA)")
        print("  • Password reset with OTP")

if __name__ == "__main__":
    print("🔄 Starting OTP migration...\n")
    asyncio.run(migrate())
