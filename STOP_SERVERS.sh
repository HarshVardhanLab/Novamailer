#!/bin/bash

echo "🛑 Stopping NovaMailer Servers..."
echo ""

# Stop backend
BACKEND_PID=$(lsof -ti:8000)
if [ ! -z "$BACKEND_PID" ]; then
    echo "Stopping Backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID
    echo "✅ Backend stopped"
else
    echo "⚠️  Backend not running"
fi

echo ""

# Stop frontend
FRONTEND_PID=$(lsof -ti:3000)
if [ ! -z "$FRONTEND_PID" ]; then
    echo "Stopping Frontend (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID
    echo "✅ Frontend stopped"
else
    echo "⚠️  Frontend not running"
fi

echo ""
echo "✅ All servers stopped"
