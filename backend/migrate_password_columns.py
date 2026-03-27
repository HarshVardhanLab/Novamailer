"""
Migrate password columns to support encrypted passwords (increase size to 512).
Run this before encrypting passwords.
"""
import asyncio
from sqlalchemy import text
from app.core.database import engine

async def migrate_columns():
    print("🔧 Updating password column sizes for encryption...")
    
    async with engine.begin() as conn:
        # Check database type
        db_url = str(engine.url)
        
        if "sqlite" in db_url:
            print("SQLite detected - column size changes not needed (TEXT type)")
            # SQLite uses TEXT which has no size limit
            
        elif "postgresql" in db_url:
            print("PostgreSQL detected - updating column types...")
            
            # Check if tables exist and update
            try:
                await conn.execute(text(
                    "ALTER TABLE smtp_configs ALTER COLUMN password TYPE VARCHAR(512)"
                ))
                print("✓ Updated smtp_configs.password column")
            except Exception as e:
                print(f"⚠️  smtp_configs: {e}")
            
            try:
                await conn.execute(text(
                    "ALTER TABLE imap_configs ALTER COLUMN password TYPE VARCHAR(512)"
                ))
                print("✓ Updated imap_configs.password column")
            except Exception as e:
                print(f"⚠️  imap_configs: {e}")
                
        elif "mysql" in db_url:
            print("MySQL detected - updating column types...")
            
            try:
                await conn.execute(text(
                    "ALTER TABLE smtp_configs MODIFY password VARCHAR(512) NOT NULL"
                ))
                print("✓ Updated smtp_configs.password column")
            except Exception as e:
                print(f"⚠️  smtp_configs: {e}")
            
            try:
                await conn.execute(text(
                    "ALTER TABLE imap_configs MODIFY password VARCHAR(512) NOT NULL"
                ))
                print("✓ Updated imap_configs.password column")
            except Exception as e:
                print(f"⚠️  imap_configs: {e}")
        
        else:
            print(f"⚠️  Unknown database type: {db_url}")
    
    print("✅ Column migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate_columns())
