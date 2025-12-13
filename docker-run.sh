#!/bin/bash

# ============================================
# NovaMailer - Docker Deployment Script
# ============================================

set -e

echo "🐳 NovaMailer Docker Deployment"
echo "================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

# Menu
echo "Select deployment option:"
echo ""
echo "1) Development (with local PostgreSQL)"
echo "2) Production (uses external database)"
echo "3) Build only (no start)"
echo "4) Stop all containers"
echo "5) View logs"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting development environment..."
        docker-compose up --build -d
        echo ""
        echo "✅ Development environment started!"
        echo ""
        echo "📍 Frontend: http://localhost:3000"
        echo "📍 Backend:  http://localhost:8000"
        echo "📍 Database: localhost:5432"
        echo ""
        echo "View logs: docker-compose logs -f"
        ;;
    2)
        echo ""
        echo "🚀 Starting production environment..."
        
        # Check for .env file
        if [ ! -f .env ]; then
            echo "❌ .env file not found!"
            echo "   Copy .env.example to .env and fill in your values"
            exit 1
        fi
        
        docker-compose -f docker-compose.prod.yml up --build -d
        echo ""
        echo "✅ Production environment started!"
        echo ""
        echo "📍 Frontend: http://localhost:3000"
        echo "📍 Backend:  http://localhost:8000"
        ;;
    3)
        echo ""
        echo "🔨 Building containers..."
        docker-compose build
        echo ""
        echo "✅ Build complete!"
        ;;
    4)
        echo ""
        echo "🛑 Stopping all containers..."
        docker-compose down
        docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
        echo ""
        echo "✅ All containers stopped!"
        ;;
    5)
        echo ""
        echo "📋 Showing logs (Ctrl+C to exit)..."
        docker-compose logs -f
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
