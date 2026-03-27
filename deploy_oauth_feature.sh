#!/bin/bash

set -e

echo "🚀 OAuth Feature Deployment Script"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "backend/app/services/oauth_service.py" ]; then
    echo -e "${RED}❌ Error: OAuth service not found. Run from project root.${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Checking OAuth configuration${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  backend/.env not found. Creating from example...${NC}"
    cp .env.example backend/.env
    echo -e "${YELLOW}⚠️  Please edit backend/.env and add OAuth credentials${NC}"
    exit 1
fi

# Check if OAuth credentials are set
if grep -q "your-google-client-id" backend/.env 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: Google OAuth credentials not configured${NC}"
    echo "   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env"
fi

if grep -q "your-microsoft-client-id" backend/.env 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: Microsoft OAuth credentials not configured${NC}"
    echo "   Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in backend/.env"
fi

echo ""
echo -e "${GREEN}Step 2: Installing dependencies${NC}"
cd backend
if [ -d "venv" ]; then
    source venv/bin/activate
    pip install -q httpx
    echo "✓ Dependencies installed"
else
    echo -e "${YELLOW}⚠️  Virtual environment not found. Install manually:${NC}"
    echo "   pip install httpx"
fi

echo ""
echo -e "${GREEN}Step 3: Running database migrations${NC}"
python migrate_oauth_columns.py
echo "✓ OAuth columns added"

echo ""
echo -e "${GREEN}Step 4: Verifying setup${NC}"
python << PYEOF
import asyncio
from sqlalchemy import select, text
from app.core.database import engine
from app.core.config import settings

async def check():
    # Check OAuth config
    print(f"  Google OAuth: {'✓ Configured' if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_ID != 'your-google-client-id.apps.googleusercontent.com' else '✗ Not configured'}")
    print(f"  Microsoft OAuth: {'✓ Configured' if settings.MICROSOFT_CLIENT_ID and settings.MICROSOFT_CLIENT_ID != 'your-microsoft-client-id' else '✗ Not configured'}")
    
    # Check database
    async with engine.begin() as conn:
        # Check if OAuth columns exist
        try:
            result = await conn.execute(text("SELECT auth_type FROM smtp_configs LIMIT 1"))
            print(f"  SMTP OAuth columns: ✓ Present")
        except Exception:
            print(f"  SMTP OAuth columns: ✗ Missing")
        
        try:
            result = await conn.execute(text("SELECT auth_type FROM imap_configs LIMIT 1"))
            print(f"  IMAP OAuth columns: ✓ Present")
        except Exception:
            print(f"  IMAP OAuth columns: ✗ Missing")

asyncio.run(check())
PYEOF

cd ..

echo ""
echo -e "${GREEN}✅ OAuth Feature Deployment Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Restart your backend server:"
echo "   pm2 restart novamailer-backend"
echo ""
echo "2. Configure OAuth credentials (if not done):"
echo "   - Google: See OAUTH_QUICK_START.md"
echo "   - Microsoft: See OAUTH_QUICK_START.md"
echo ""
echo "3. Test OAuth connection:"
echo "   - Open Settings page"
echo "   - Click 'Connect with Google' or 'Connect with Microsoft'"
echo "   - Grant permissions"
echo "   - Verify connection"
echo ""
echo "For detailed setup: See OAUTH_SETUP_GUIDE.md"
