#!/bin/bash

# Fresh NovaMailer Deployment
# Creates everything from scratch

set -e

echo "🚀 NovaMailer - Fresh Deployment"
echo "================================="
echo ""

RESOURCE_GROUP="novamailer"
APP_SERVICE_PLAN="novamailer-plan"
BACKEND_APP="novamailer-backend-$(date +%s)"
FRONTEND_APP="novamailer-frontend-$(date +%s)"

echo "📦 Resource Group: $RESOURCE_GROUP"
echo "🔧 Backend App: $BACKEND_APP"
echo "🎨 Frontend App: $FRONTEND_APP"
echo ""

# Get location
LOCATION=$(az group show --name $RESOURCE_GROUP --query location --output tsv 2>/dev/null || echo "centralindia")
echo "🌍 Location: $LOCATION"
echo ""

# Check if App Service Plan exists, create if not
if az appservice plan show --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP &>/dev/null; then
    echo "✅ App Service Plan already exists"
else
    echo "🔧 Creating App Service Plan (Free tier)..."
    az appservice plan create \
      --name $APP_SERVICE_PLAN \
      --resource-group $RESOURCE_GROUP \
      --location $LOCATION \
      --sku F1 \
      --is-linux \
      --output none
    
    echo "✅ App Service Plan created"
    echo "⏳ Waiting for plan to be ready..."
    sleep 5
fi
echo ""

# Generate secret key
SECRET_KEY=$(openssl rand -hex 32)

# Create backend app
echo "🚀 Creating backend app..."
az webapp create \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "PYTHON:3.11" \
  --output none

echo "✅ Backend app created"
echo ""

# Configure backend
echo "🔧 Configuring backend..."
az webapp config appsettings set \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    DATABASE_URL="sqlite+aiosqlite:///./data/novamailer.db" \
    SECRET_KEY="$SECRET_KEY" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
  --output none

az webapp config set \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --startup-file "startup.sh" \
  --output none

echo "✅ Backend configured"
echo ""

# Deploy backend
echo "📤 Deploying backend..."
cd backend
zip -r ../backend.zip . -x "venv/*" -x "__pycache__/*" -x "*.pyc" -x ".git/*" -x "*.db" > /dev/null
cd ..

az webapp deployment source config-zip \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --src backend.zip

rm backend.zip
echo "✅ Backend deployed"
echo ""

# Get backend URL
BACKEND_URL="https://$BACKEND_APP.azurewebsites.net"
echo "🔗 Backend URL: $BACKEND_URL"
echo ""

# Create frontend app
echo "🚀 Creating frontend app..."
az webapp create \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "NODE:18-lts" \
  --output none

echo "✅ Frontend app created"
echo ""

# Configure frontend
echo "🔧 Configuring frontend..."
az webapp config appsettings set \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NEXT_PUBLIC_API_URL="$BACKEND_URL" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
  --output none

az webapp config set \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --startup-file "npm install && npm run build && npm start" \
  --output none

echo "✅ Frontend configured"
echo ""

# Deploy frontend
echo "📤 Deploying frontend..."
cd frontend
zip -r ../frontend.zip . -x "node_modules/*" -x ".next/*" -x ".git/*" > /dev/null
cd ..

az webapp deployment source config-zip \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --src frontend.zip

rm frontend.zip
echo "✅ Frontend deployed"
echo ""

# Get frontend URL
FRONTEND_URL="https://$FRONTEND_APP.azurewebsites.net"
echo "🔗 Frontend URL: $FRONTEND_URL"
echo ""

# Update backend CORS
echo "🔧 Updating backend CORS..."
az webapp config appsettings set \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings CORS_ORIGINS="$FRONTEND_URL" \
  --output none

echo "✅ CORS updated"
echo ""

# Save URLs
cat > deployment-urls.txt << EOF
NovaMailer Deployment URLs
==========================

Frontend: $FRONTEND_URL
Backend:  $BACKEND_URL

Backend App Name: $BACKEND_APP
Frontend App Name: $FRONTEND_APP

Deployed: $(date)
EOF

echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "📱 Frontend: $FRONTEND_URL"
echo "🔧 Backend:  $BACKEND_URL"
echo ""
echo "⚠️  Apps will take 2-3 minutes to start (Free tier)"
echo ""
echo "Next steps:"
echo "1. Wait 2-3 minutes"
echo "2. Visit $FRONTEND_URL"
echo "3. Register your account"
echo ""
