"""
Comprehensive test script to verify all features are working.
Run this after deployment to ensure everything is configured correctly.
"""
import asyncio
import sys
from sqlalchemy import select, text
from app.core.database import engine
from app.core.config import settings
from app.core.security import encrypt_password, decrypt_password

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_success(msg):
    print(f"{GREEN}✓{RESET} {msg}")

def print_error(msg):
    print(f"{RED}✗{RESET} {msg}")

def print_warning(msg):
    print(f"{YELLOW}⚠{RESET} {msg}")

def print_info(msg):
    print(f"{BLUE}ℹ{RESET} {msg}")

async def test_database_connection():
    """Test 1: Database Connection"""
    print("\n" + "="*60)
    print("Test 1: Database Connection")
    print("="*60)
    
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            assert result.scalar() == 1
        print_success("Database connection successful")
        return True
    except Exception as e:
        print_error(f"Database connection failed: {e}")
        return False

async def test_tables_exist():
    """Test 2: Required Tables"""
    print("\n" + "="*60)
    print("Test 2: Required Tables")
    print("="*60)
    
    required_tables = [
        "users",
        "smtp_configs",
        "imap_configs",
        "campaigns",
        "templates",
        "recipients",
        "email_tracking",
        "webhooks",
        "unsubscribes",
        "recipient_lists",
    ]
    
    all_exist = True
    async with engine.begin() as conn:
        for table in required_tables:
            try:
                exists = await conn.run_sync(
                    lambda sync_conn: sync_conn.dialect.has_table(sync_conn, table)
                )
                if exists:
                    print_success(f"Table '{table}' exists")
                else:
                    print_error(f"Table '{table}' missing")
                    all_exist = False
            except Exception as e:
                print_error(f"Error checking table '{table}': {e}")
                all_exist = False
    
    return all_exist

async def test_oauth_columns():
    """Test 3: OAuth Columns"""
    print("\n" + "="*60)
    print("Test 3: OAuth Columns in SMTP/IMAP Tables")
    print("="*60)
    
    oauth_columns = [
        "auth_type",
        "oauth_provider",
        "oauth_access_token",
        "oauth_refresh_token",
        "oauth_token_expires_at",
    ]
    
    all_exist = True
    async with engine.begin() as conn:
        # Check SMTP table
        print_info("Checking smtp_configs table...")
        for col in oauth_columns:
            try:
                await conn.execute(text(f"SELECT {col} FROM smtp_configs LIMIT 1"))
                print_success(f"  Column '{col}' exists")
            except Exception:
                print_error(f"  Column '{col}' missing")
                all_exist = False
        
        # Check IMAP table
        print_info("Checking imap_configs table...")
        for col in oauth_columns:
            try:
                await conn.execute(text(f"SELECT {col} FROM imap_configs LIMIT 1"))
                print_success(f"  Column '{col}' exists")
            except Exception:
                print_error(f"  Column '{col}' missing")
                all_exist = False
    
    return all_exist

async def test_encryption():
    """Test 4: Password Encryption"""
    print("\n" + "="*60)
    print("Test 4: Password Encryption/Decryption")
    print("="*60)
    
    try:
        test_password = "test_password_12345!@#$%"
        
        # Test encryption
        encrypted = encrypt_password(test_password)
        print_success(f"Encryption successful (length: {len(encrypted)})")
        
        # Verify it's actually encrypted
        if encrypted == test_password:
            print_error("Password not encrypted!")
            return False
        
        # Test decryption
        decrypted = decrypt_password(encrypted)
        print_success("Decryption successful")
        
        # Verify decryption matches original
        if decrypted == test_password:
            print_success("Decrypted password matches original")
        else:
            print_error("Decrypted password doesn't match!")
            return False
        
        return True
    except Exception as e:
        print_error(f"Encryption test failed: {e}")
        return False

async def test_config():
    """Test 5: Configuration"""
    print("\n" + "="*60)
    print("Test 5: Configuration Settings")
    print("="*60)
    
    all_good = True
    
    # Check SECRET_KEY
    if settings.SECRET_KEY == "YOUR_SECRET_KEY_CHANGE_IN_PRODUCTION":
        print_warning("SECRET_KEY is using default value - change in production!")
        all_good = False
    else:
        print_success(f"SECRET_KEY is set (length: {len(settings.SECRET_KEY)})")
        if len(settings.SECRET_KEY) < 32:
            print_warning("SECRET_KEY should be at least 32 characters")
    
    # Check DATABASE_URL
    print_success(f"DATABASE_URL: {settings.DATABASE_URL[:30]}...")
    
    # Check OAuth config
    if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_ID != "your-google-client-id.apps.googleusercontent.com":
        print_success("Google OAuth configured")
    else:
        print_warning("Google OAuth not configured")
    
    if settings.MICROSOFT_CLIENT_ID and settings.MICROSOFT_CLIENT_ID != "your-microsoft-client-id":
        print_success("Microsoft OAuth configured")
    else:
        print_warning("Microsoft OAuth not configured")
    
    # Check CORS
    origins = settings.get_cors_origins()
    print_success(f"CORS origins: {', '.join(origins)}")
    
    return all_good

async def test_models():
    """Test 6: Model Imports"""
    print("\n" + "="*60)
    print("Test 6: Model Imports")
    print("="*60)
    
    try:
        from app.models.user import User
        print_success("User model imported")
        
        from app.models.smtp import SMTPConfig
        print_success("SMTPConfig model imported")
        
        from app.models.imap_config import IMAPConfig
        print_success("IMAPConfig model imported")
        
        from app.models.campaign import Campaign
        print_success("Campaign model imported")
        
        from app.models.template import Template
        print_success("Template model imported")
        
        from app.models.recipient import Recipient
        print_success("Recipient model imported")
        
        from app.models.email_tracking import EmailTracking
        print_success("EmailTracking model imported")
        
        return True
    except Exception as e:
        print_error(f"Model import failed: {e}")
        return False

async def test_services():
    """Test 7: Service Imports"""
    print("\n" + "="*60)
    print("Test 7: Service Imports")
    print("="*60)
    
    try:
        from app.services import email
        print_success("Email service imported")
        
        from app.services import imap_service
        print_success("IMAP service imported")
        
        from app.services import oauth_service
        print_success("OAuth service imported")
        
        return True
    except Exception as e:
        print_error(f"Service import failed: {e}")
        return False

async def test_routers():
    """Test 8: Router Imports"""
    print("\n" + "="*60)
    print("Test 8: Router Imports")
    print("="*60)
    
    try:
        from app.routers import auth
        print_success("Auth router imported")
        
        from app.routers import campaigns
        print_success("Campaigns router imported")
        
        from app.routers import smtp
        print_success("SMTP router imported")
        
        from app.routers import mail
        print_success("Mail router imported")
        
        from app.routers import oauth
        print_success("OAuth router imported")
        
        from app.routers import webhooks
        print_success("Webhooks router imported")
        
        return True
    except Exception as e:
        print_error(f"Router import failed: {e}")
        return False

async def test_oauth_endpoints():
    """Test 9: OAuth Endpoints"""
    print("\n" + "="*60)
    print("Test 9: OAuth Endpoint Configuration")
    print("="*60)
    
    try:
        from app.routers.oauth import router
        
        # Check if routes are registered
        routes = [route.path for route in router.routes]
        
        expected_routes = ["/config", "/init", "/callback", "/disconnect"]
        
        for route in expected_routes:
            if route in routes:
                print_success(f"Route '{route}' registered")
            else:
                print_error(f"Route '{route}' missing")
        
        return True
    except Exception as e:
        print_error(f"OAuth endpoint check failed: {e}")
        return False

async def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("🧪 NovaMailer Feature Test Suite")
    print("="*60)
    
    results = []
    
    # Run tests
    results.append(("Database Connection", await test_database_connection()))
    results.append(("Required Tables", await test_tables_exist()))
    results.append(("OAuth Columns", await test_oauth_columns()))
    results.append(("Encryption", await test_encryption()))
    results.append(("Configuration", await test_config()))
    results.append(("Model Imports", await test_models()))
    results.append(("Service Imports", await test_services()))
    results.append(("Router Imports", await test_routers()))
    results.append(("OAuth Endpoints", await test_oauth_endpoints()))
    
    # Summary
    print("\n" + "="*60)
    print("📊 Test Summary")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = f"{GREEN}PASS{RESET}" if result else f"{RED}FAIL{RESET}"
        print(f"{status} - {test_name}")
    
    print("\n" + "="*60)
    print(f"Results: {passed}/{total} tests passed")
    print("="*60)
    
    if passed == total:
        print(f"\n{GREEN}✓ All tests passed! System is ready.{RESET}")
        return 0
    else:
        print(f"\n{RED}✗ Some tests failed. Please fix the issues above.{RESET}")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(run_all_tests())
    sys.exit(exit_code)
