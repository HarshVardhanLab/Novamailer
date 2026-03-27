"""
Add OAuth columns to smtp_configs and imap_configs tables.
Run this to enable OAuth authentication support.
"""
import asyncio
from sqlalchemy import text
from app.core.database import engine

async def add_oauth_columns():
    print("🔧 Adding OAuth columns to email configuration tables...")
    
    async with engine.begin() as conn:
        db_url = str(engine.url)
        
        # Columns to add
        smtp_columns = [
            ("auth_type", "VARCHAR(50) DEFAULT 'password'"),
            ("oauth_provider", "VARCHAR(50)"),
            ("oauth_access_token", "VARCHAR(2048)"),
            ("oauth_refresh_token", "VARCHAR(2048)"),
            ("oauth_token_expires_at", "DATETIME"),
        ]
        
        imap_columns = [
            ("auth_type", "VARCHAR(50) DEFAULT 'password'"),
            ("oauth_provider", "VARCHAR(50)"),
            ("oauth_access_token", "VARCHAR(2048)"),
            ("oauth_refresh_token", "VARCHAR(2048)"),
            ("oauth_token_expires_at", "DATETIME"),
        ]
        
        if "sqlite" in db_url:
            print("SQLite detected")
            
            # Add columns to smtp_configs
            for col_name, col_type in smtp_columns:
                try:
                    await conn.execute(text(f"ALTER TABLE smtp_configs ADD COLUMN {col_name} {col_type}"))
                    print(f"  ✓ Added smtp_configs.{col_name}")
                except Exception as e:
                    if "duplicate column" in str(e).lower():
                        print(f"  ⏭  smtp_configs.{col_name} already exists")
                    else:
                        print(f"  ⚠️  smtp_configs.{col_name}: {e}")
            
            # Add columns to imap_configs
            for col_name, col_type in imap_columns:
                try:
                    await conn.execute(text(f"ALTER TABLE imap_configs ADD COLUMN {col_name} {col_type}"))
                    print(f"  ✓ Added imap_configs.{col_name}")
                except Exception as e:
                    if "duplicate column" in str(e).lower():
                        print(f"  ⏭  imap_configs.{col_name} already exists")
                    else:
                        print(f"  ⚠️  imap_configs.{col_name}: {e}")
        
        elif "postgresql" in db_url:
            print("PostgreSQL detected")
            
            # Add columns to smtp_configs
            for col_name, col_type in smtp_columns:
                try:
                    await conn.execute(text(
                        f"ALTER TABLE smtp_configs ADD COLUMN IF NOT EXISTS {col_name} {col_type}"
                    ))
                    print(f"  ✓ Added smtp_configs.{col_name}")
                except Exception as e:
                    print(f"  ⚠️  smtp_configs.{col_name}: {e}")
            
            # Add columns to imap_configs
            for col_name, col_type in imap_columns:
                try:
                    await conn.execute(text(
                        f"ALTER TABLE imap_configs ADD COLUMN IF NOT EXISTS {col_name} {col_type}"
                    ))
                    print(f"  ✓ Added imap_configs.{col_name}")
                except Exception as e:
                    print(f"  ⚠️  imap_configs.{col_name}: {e}")
        
        elif "mysql" in db_url:
            print("MySQL detected")
            
            # Add columns to smtp_configs
            for col_name, col_type in smtp_columns:
                try:
                    # Check if column exists
                    result = await conn.execute(text(
                        f"SELECT COUNT(*) FROM information_schema.columns "
                        f"WHERE table_name='smtp_configs' AND column_name='{col_name}'"
                    ))
                    if result.scalar() == 0:
                        await conn.execute(text(f"ALTER TABLE smtp_configs ADD {col_name} {col_type}"))
                        print(f"  ✓ Added smtp_configs.{col_name}")
                    else:
                        print(f"  ⏭  smtp_configs.{col_name} already exists")
                except Exception as e:
                    print(f"  ⚠️  smtp_configs.{col_name}: {e}")
            
            # Add columns to imap_configs
            for col_name, col_type in imap_columns:
                try:
                    result = await conn.execute(text(
                        f"SELECT COUNT(*) FROM information_schema.columns "
                        f"WHERE table_name='imap_configs' AND column_name='{col_name}'"
                    ))
                    if result.scalar() == 0:
                        await conn.execute(text(f"ALTER TABLE imap_configs ADD {col_name} {col_type}"))
                        print(f"  ✓ Added imap_configs.{col_name}")
                    else:
                        print(f"  ⏭  imap_configs.{col_name} already exists")
                except Exception as e:
                    print(f"  ⚠️  imap_configs.{col_name}: {e}")
        
        else:
            print(f"⚠️  Unknown database type: {db_url}")
    
    print("\n✅ OAuth columns migration complete!")
    print("\nNext steps:")
    print("1. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env")
    print("2. Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in backend/.env")
    print("3. Restart backend server")
    print("4. Test OAuth connection in Settings page")

if __name__ == "__main__":
    asyncio.run(add_oauth_columns())
