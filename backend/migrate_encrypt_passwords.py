"""
Migrate existing SMTP/IMAP passwords to encrypted format.
Run this once after deploying the encryption changes.
"""
import asyncio
from sqlalchemy import select, text
from app.core.database import get_db, engine
from app.models.smtp import SMTPConfig
from app.models.imap_config import IMAPConfig
from app.core.security import encrypt_password

async def migrate_passwords():
    print("🔐 Starting password encryption migration...")
    
    async with engine.begin() as conn:
        # Check if tables exist
        smtp_exists = await conn.run_sync(
            lambda sync_conn: sync_conn.dialect.has_table(sync_conn, "smtp_configs")
        )
        imap_exists = await conn.run_sync(
            lambda sync_conn: sync_conn.dialect.has_table(sync_conn, "imap_configs")
        )
        
        if not smtp_exists and not imap_exists:
            print("⚠️  No SMTP or IMAP tables found. Skipping migration.")
            return
        
        # Migrate SMTP passwords
        if smtp_exists:
            result = await conn.execute(select(SMTPConfig))
            smtp_configs = result.scalars().all()
            
            for config in smtp_configs:
                try:
                    # Try to decrypt - if it fails, it's plain text
                    from app.core.security import decrypt_password
                    decrypt_password(config._password)
                    print(f"✓ SMTP config {config.id} already encrypted")
                except Exception:
                    # Plain text password - encrypt it
                    plain_password = config._password
                    encrypted = encrypt_password(plain_password)
                    await conn.execute(
                        text("UPDATE smtp_configs SET password = :pwd WHERE id = :id"),
                        {"pwd": encrypted, "id": config.id}
                    )
                    print(f"✓ Encrypted SMTP config {config.id}")
        
        # Migrate IMAP passwords
        if imap_exists:
            result = await conn.execute(select(IMAPConfig))
            imap_configs = result.scalars().all()
            
            for config in imap_configs:
                try:
                    from app.core.security import decrypt_password
                    decrypt_password(config._password)
                    print(f"✓ IMAP config {config.id} already encrypted")
                except Exception:
                    plain_password = config._password
                    encrypted = encrypt_password(plain_password)
                    await conn.execute(
                        text("UPDATE imap_configs SET password = :pwd WHERE id = :id"),
                        {"pwd": encrypted, "id": config.id}
                    )
                    print(f"✓ Encrypted IMAP config {config.id}")
    
    print("✅ Password encryption migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate_passwords())
