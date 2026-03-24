#!/bin/bash

# NovaMailer Supabase Setup Script
# This script helps you configure Supabase database for NovaMailer

set -e

echo "🚀 NovaMailer Supabase Setup"
echo "============================"
echo ""

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env file not found!"
    echo "Creating from template..."
    cp backend/.env.supabase backend/.env
fi

echo "📋 Please provide your Supabase credentials:"
echo ""
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Go to: Project Settings → Database"
echo "4. Copy the Connection String (URI format)"
echo ""

read -p "Enter your Supabase DATABASE_URL: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL cannot be empty!"
    exit 1
fi

# Update .env file
echo "📝 Updating backend/.env..."
if grep -q "^DATABASE_URL=" backend/.env; then
    # Replace existing DATABASE_URL
    sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" backend/.env
    rm backend/.env.bak
else
    # Add DATABASE_URL
    echo "DATABASE_URL=$DATABASE_URL" >> backend/.env
fi

echo "✅ DATABASE_URL updated in backend/.env"
echo ""

# Create tables
echo "🗄️  Creating database tables..."
cd backend
python3 create_tables.py
cd ..

echo ""
echo "✅ Supabase setup complete!"
echo ""
echo "📊 Your database is ready at:"
echo "   https://supabase.com/dashboard"
echo ""
echo "🎯 Next steps:"
echo "   1. Run: ./run-local.sh"
echo "   2. Open: http://localhost:3000"
echo "   3. Register a new account"
echo ""
