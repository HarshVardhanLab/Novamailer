#!/bin/bash

# NovaMailer Desktop App Builder
# This script builds the desktop application for distribution

set -e

echo "🏗️  Building NovaMailer Desktop App..."
echo ""

# Install dependencies if needed
if [ ! -d "electron/node_modules" ]; then
    echo "📦 Installing Electron dependencies..."
    cd electron
    npm install
    cd ..
    echo ""
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing Frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo ""
fi

# Build the frontend
echo "⚛️  Building Next.js frontend..."
cd frontend
npm run build
cd ..
echo "✅ Frontend build complete"
echo ""

# Build the Electron app
echo "🖥️  Building Electron app..."
cd electron

# Detect platform and build accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Building for macOS..."
    npm run build:mac
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Building for Linux..."
    npm run build:linux
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "Building for Windows..."
    npm run build:win
else
    echo "Building for all platforms..."
    npm run build
fi

cd ..
echo ""
echo "✅ Build complete! Check electron/dist/ for the packaged app"
