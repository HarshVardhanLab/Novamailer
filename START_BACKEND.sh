#!/bin/bash

echo "🚀 Starting NovaMailer Backend..."
echo ""

cd backend

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run: python3 -m venv venv"
    exit 1
fi

# Activate venv and start server
source venv/bin/activate

echo "✅ Virtual environment activated"
echo "🔄 Starting Uvicorn server..."
echo ""
echo "Backend will be available at:"
echo "  - API: http://localhost:8000"
echo "  - Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

uvicorn main:app --reload --host 0.0.0.0 --port 8000
