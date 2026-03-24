#!/bin/bash

# NovaMailer Desktop App Launcher
# This script starts the Electron desktop application

set -e

echo "🚀 Starting NovaMailer Desktop App..."
echo ""

# Check if electron dependencies are installed
if [ ! -d "electron/node_modules" ]; then
    echo "📦 Installing Electron dependencies..."
    cd electron
    npm install
    cd ..
    echo ""
fi

# Check if backend venv exists
if [ ! -d "backend/venv" ]; then
    echo "🐍 Setting up Python virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo ""
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing Frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo ""
fi

# Start the Electron app
echo "🖥️  Launching NovaMailer Desktop..."
cd electron
npm run dev
