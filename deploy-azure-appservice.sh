#!/bin/bash

# NovaMailer - Azure App Service Deployment Script
# For Azure for Students Starter subscription

set -e

echo "🚀 NovaMailer - Azure App Service Deployment"
echo "============================================="
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Error: Azure CLI is not installed"
    echo "Please install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo "❌ Error: Not logged in to Azure"
    echo "Please run: az login"
    exit 1
fi

# Set variables
RESOURCE_GROUP="${RESOURCE_GROUP:-novamailer-rg}"
APP_SERVICE_PLAN="novamailer-plan"
BACKEND_APP="novamailer-backend"
FRONTEND_APP="novamailer-frontend"

echo "📦 Resource Group: $RESOURCE_GROUP"

# Get location from existing resource group
if az group show --name $RESOURCE_GROUP &>/dev/null; then
    LOCATION=$(az group show --name $RESOURCE_GROUP --query location --output tsv)
    echo "✅ Using existing resource group"
    echo "🌍 Location: $LOCATION"
else
    LOCATION="${LOCATION:-centralindia}"
    echo "🌍 Location: $LOCATION"
    echo "🔧 Creating resource group..."
    az group create \
      --name $RESOURCE_GROUP \
      --location $LOCATION \
      --output none
    echo "✅ Resource group created"
fi
echo ""

# Check if App Service Plan already exists
if az appservice plan show --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP --output none 2>/dev/null; then
    echo "✅ App Service Plan already exists"
else
    # Create App Service Plan (Free tier)
    echo "🔧 Creating App Service Plan (Free tier)..."
    az appservice plan create \
      --name $APP_SERVICE_PLAN \
      --resource-group $RESOURCE_GROUP \
      --location $LOCATION \
      --sku F1 \
      --is-linux \
      --output none
    
    echo "✅ App Service Plan created"
    
    # Wait for plan to be fully ready
    echo "⏳ Waiting for App Service Plan to be ready..."
    sleep 5
fi
echo ""

# Generate secret key
SECRET_KEY=$(openssl rand -hex 32)

# Create Backend Web App
echo "🚀 Creating Backend Web App..."
az webapp create \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "PYTHON:3.11" \
  --output none

# Configure backend
echo "🔧 Configuring backend..."
az webapp config appsettings set \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    DATABASE_URL="sqlite:///./data/novamailer.db" \
    SECRET_KEY="$SECRET_KEY" \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
  --output none

# Get backend URL
BACKEND_URL=$(az webapp show \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostName \
  --output tsv)
BACKEND_URL="https://$BACKEND_URL"
echo "✅ Backend app created: $BACKEND_URL"
echo ""

# Deploy backend code
echo "📤 Deploying backend code..."
cd backend
zip -r ../backend.zip . -x "venv/*" -x "__pycache__/*" -x "*.pyc" -x ".git/*"
cd ..

az webapp deployment source config-zip \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --src backend.zip \
  --output none

rm backend.zip
echo "✅ Backend deployed"
echo ""

# Create Frontend Web App
echo "🚀 Creating Frontend Web App..."
az webapp create \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "NODE:18-lts" \
  --output none

# Configure frontend
echo "🔧 Configuring frontend..."
az webapp config appsettings set \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NEXT_PUBLIC_API_URL="$BACKEND_URL" \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
  --output none

# Get frontend URL
FRONTEND_URL=$(az webapp show \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostName \
  --output tsv)
FRONTEND_URL="https://$FRONTEND_URL"
echo "✅ Frontend app created: $FRONTEND_URL"
echo ""

# Deploy frontend code
echo "📤 Deploying frontend code..."
cd frontend
zip -r ../frontend.zip . -x "node_modules/*" -x ".next/*" -x ".git/*"
cd ..

az webapp deployment source config-zip \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --src frontend.zip \
  --output none

rm frontend.zip
echo "✅ Frontend deployed"
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

# Restart apps
echo "🔄 Restarting apps..."
az webapp restart --name $BACKEND_APP --resource-group $RESOURCE_GROUP --output none
az webapp restart --name $FRONTEND_APP --resource-group $RESOURCE_GROUP --output none
echo "✅ Apps restarted"
echo ""

# Save URLs
echo "Frontend: $FRONTEND_URL" > azure-deployment-urls.txt
echo "Backend: $BACKEND_URL" >> azure-deployment-urls.txt

# Display results
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "📱 Frontend URL: $FRONTEND_URL"
echo "🔧 Backend URL:  $BACKEND_URL"
echo ""
echo "URLs saved to: azure-deployment-urls.txt"
echo ""
echo "⚠️  Note: First request may take 1-2 minutes as apps start up"
echo ""
echo "Next steps:"
echo "1. Visit $FRONTEND_URL to access your application"
echo "2. Register your admin account"
echo "3. Configure SMTP settings in the app"
echo ""
echo "To view logs:"
echo "  az webapp log tail --name $BACKEND_APP --resource-group $RESOURCE_GROUP"
echo "  az webapp log tail --name $FRONTEND_APP --resource-group $RESOURCE_GROUP"
echo ""
