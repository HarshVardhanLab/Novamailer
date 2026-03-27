"""
Quick test script to verify IMAP setup is working correctly.
Run this after deployment to ensure everything is configured properly.
"""
import asyncio
from sqlalchemy import select, text
from app.core.database import engine
from app.core.security import encrypt_password, decrypt_password
from app.models.imap_config import IMAPConfig
from app.models.smtp import SMTPConfig

async def test_setup():
    print("🧪 Testing IMAP Setup")
    print("=" * 50)
    
    # Test 1: Database connection
    print("\n1. Testing database connection...")
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            assert result.scalar() == 1
        print("   ✅ Database connection OK")
    except Exception as e:
        print(f"   ❌ Database connection failed: {e}")
        return False
    
    # Test 2: Check tables exist
    print("\n2. Checking tables exist...")
    try:
        async with engine.begin() as conn:
            # Check SMTP table
            smtp_exists = await conn.run_sync(
                lambda sync_conn: sync_conn.dialect.has_table(sync_conn, "smtp_configs")
            )
            if smtp_exists:
                print("   ✅ smtp_configs table exists")
            else:
                print("   ⚠️  smtp_configs table not found")
            
            # Check IMAP table
            imap_exists = await conn.run_sync(
                lambda sync_conn: sync_conn.dialect.has_table(sync_conn, "imap_configs")
            )
            if imap_exists:
                print("   ✅ imap_configs table exists")
            else:
                print("   ❌ imap_configs table not found - run create_tables.py")
                return False
    except Exception as e:
        print(f"   ❌ Table check failed: {e}")
        return False
    
    # Test 3: Password encryption/decryption
    print("\n3. Testing password encryption...")
    try:
        test_password = "test_password_123"
        encrypted = encrypt_password(test_password)
        decrypted = decrypt_password(encrypted)
        
        assert decrypted == test_password, "Decrypted password doesn't match"
        assert encrypted != test_password, "Password not encrypted"
        assert len(encrypted) > len(test_password), "Encrypted password too short"
        
        print(f"   ✅ Encryption working (encrypted length: {len(encrypted)})")
    except Exception as e:
        print(f"   ❌ Encryption test failed: {e}")
        return False
    
    # Test 4: Check existing configs
    print("\n4. Checking existing configurations...")
    try:
        async with engine.begin() as conn:
            # Count SMTP configs
            result = await conn.execute(text("SELECT COUNT(*) FROM smtp_configs"))
            smtp_count = result.scalar()
            print(f"   📊 SMTP configs: {smtp_count}")
            
            # Count IMAP configs
            result = await conn.execute(text("SELECT COUNT(*) FROM imap_configs"))
            imap_count = result.scalar()
            print(f"   📊 IMAP configs: {imap_count}")
            
            if smtp_count > 0 or imap_count > 0:
                print("   ℹ️  Existing configs found - ensure they're encrypted")
    except Exception as e:
        print(f"   ⚠️  Config check failed: {e}")
    
    # Test 5: Model property access
    print("\n5. Testing model password properties...")
    try:
        # Create test IMAP config (not saved to DB)
        test_config = IMAPConfig()
        test_config.host = "imap.test.com"
        test_config.port = 993
        test_config.username = "test@test.com"
        test_config.password = "test_password"  # Should trigger encryption
        
        # Access password (should trigger decryption)
        retrieved = test_config.password
        assert retrieved == "test_password", "Password property not working"
        
        print("   ✅ Model password properties working")
    except Exception as e:
        print(f"   ❌ Model test failed: {e}")
        return False
    
    # Test 6: Check SECRET_KEY
    print("\n6. Checking SECRET_KEY...")
    try:
        from app.core.config import settings
        if settings.SECRET_KEY == "YOUR_SECRET_KEY_CHANGE_IN_PRODUCTION":
            print("   ⚠️  WARNING: Using default SECRET_KEY!")
            print("      Set a strong SECRET_KEY in production!")
        else:
            print(f"   ✅ SECRET_KEY is set (length: {len(settings.SECRET_KEY)})")
            if len(settings.SECRET_KEY) < 32:
                print("   ⚠️  WARNING: SECRET_KEY should be at least 32 characters")
    except Exception as e:
        print(f"   ⚠️  SECRET_KEY check failed: {e}")
    
    print("\n" + "=" * 50)
    print("✅ All tests passed! IMAP setup is ready.")
    print("\nNext steps:")
    print("1. Restart your backend server")
    print("2. Test SMTP config in Settings page")
    print("3. Test IMAP config in Settings page")
    print("4. Verify Mail page auto-connects")
    return True

if __name__ == "__main__":
    success = asyncio.run(test_setup())
    exit(0 if success else 1)
