#!/bin/bash

set -e

echo "🚀 IMAP Feature Deployment Script"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "backend/create_tables.py" ]; then
    echo -e "${RED}❌ Error: Must run from project root directory${NC}"
    exit 1
fi

# Check if SECRET_KEY is set
if [ -z "$SECRET_KEY" ] && [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Warning: SECRET_KEY not found in environment or .env file${NC}"
    echo "   Password encryption requires SECRET_KEY to be set."
    echo "   Please set it in backend/.env before continuing."
    exit 1
fi

echo -e "${GREEN}Step 1: Installing dependencies${NC}"
cd backend
if [ -d "venv" ]; then
    source venv/bin/activate
    pip install -q cryptography
    echo "✓ Dependencies installed"
else
    echo -e "${YELLOW}⚠️  Virtual environment not found. Install manually:${NC}"
    echo "   pip install cryptography"
fi

echo ""
echo -e "${GREEN}Step 2: Creating database tables${NC}"
python create_tables.py
echo "✓ Tables created"

echo ""
echo -e "${GREEN}Step 3: Updating password column sizes${NC}"
python migrate_password_columns.py
echo "✓ Columns updated"

echo ""
echo -e "${GREEN}Step 4: Encrypting existing passwords${NC}"
python migrate_encrypt_passwords.py
echo "✓ Passwords encrypted"

echo ""
echo -e "${GREEN}Step 5: Running diagnostics${NC}"
python << PYEOF
import asyncio
from sqlalchemy import select, text
from app.core.database import engine
from app.models.imap_config import IMAPConfig
from app.models.smtp import SMTPConfig

async def check():
    async with engine.begin() as conn:
        # Check IMAP table
        result = await conn.execute(text("SELECT COUNT(*) FROM imap_configs"))
        imap_count = result.scalar()
        print(f"  IMAP configs: {imap_count}")
        
        # Check SMTP table
        result = await conn.execute(text("SELECT COUNT(*) FROM smtp_configs"))
        smtp_count = result.scalar()
        print(f"  SMTP configs: {smtp_count}")
        
        print("")
        print("✓ Database health check passed")

asyncio.run(check())
PYEOF

cd ..

echo ""
echo -e "${GREEN}✅ IMAP Feature Deployment Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Restart your backend server"
echo "2. Test SMTP configuration in Settings"
echo "3. Test IMAP configuration in Settings"
echo "4. Verify Mail page auto-connects"
echo ""
echo "For detailed testing, see: IMAP_DEPLOYMENT_GUIDE.md"
