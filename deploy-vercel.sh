#!/bin/bash

# ============================================
# NovaMailer - Vercel + Supabase Deployment
# ============================================

set -e

echo "🚀 NovaMailer Deployment Script"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

echo ""
echo "============================================"
echo "📋 STEP 1: Setup Supabase Database (FREE)"
echo "============================================"
echo ""
echo "1. Go to: https://supabase.com"
echo "2. Sign up / Login with GitHub"
echo "3. Click 'New Project'"
echo "4. Choose a name & strong password (SAVE THIS!)"
echo "5. Select region closest to you"
echo "6. Wait for project to be created (~2 min)"
echo ""
echo "7. Go to: Project Settings > Database"
echo "8. Scroll to 'Connection string' section"
echo "9. Select 'URI' tab"
echo "10. Copy the connection string"
echo ""
echo -e "${YELLOW}Your connection string looks like:${NC}"
echo "postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"
echo ""
read -p "Press Enter when you have your Supabase DATABASE_URL ready..."

echo ""
echo "============================================"
echo "📋 STEP 2: Deploy Backend to Vercel"
echo "============================================"
echo ""

cd backend

# Login check
vercel whoami 2>/dev/null || vercel login

echo ""
echo "Deploying backend..."
echo ""

# Deploy backend
vercel --prod

echo ""
echo -e "${GREEN}✅ Backend deployed!${NC}"
echo ""
echo "Copy your backend URL (e.g., https://your-backend.vercel.app)"
read -p "Enter your backend URL: " BACKEND_URL

cd ..

echo ""
echo "============================================"
echo "📋 STEP 3: Deploy Frontend to Vercel"
echo "============================================"
echo ""

cd frontend

echo "Deploying frontend..."
echo ""

# Deploy frontend
vercel --prod

echo ""
echo -e "${GREEN}✅ Frontend deployed!${NC}"
echo ""

cd ..

echo ""
echo "============================================"
echo "📋 STEP 4: Set Environment Variables"
echo "============================================"
echo ""
echo "Go to Vercel Dashboard for BOTH projects and set:"
echo ""
echo -e "${YELLOW}BACKEND Environment Variables:${NC}"
echo "  DATABASE_URL     = [Your Supabase connection string]"
echo "  SECRET_KEY       = $(openssl rand -hex 32)"
echo "  CORS_ORIGINS     = [Your frontend Vercel URL]"
echo "  FRONTEND_URL     = [Your frontend Vercel URL]"
echo ""
echo -e "${YELLOW}FRONTEND Environment Variables:${NC}"
echo "  NEXT_PUBLIC_API_URL = ${BACKEND_URL:-https://your-backend.vercel.app}"
echo ""
echo "============================================"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "============================================"
echo ""
echo "After setting env vars, redeploy both projects:"
echo "  cd backend && vercel --prod"
echo "  cd frontend && vercel --prod"
echo ""
