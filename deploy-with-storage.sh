#!/bin/bash
# NovaMailer - Azure Deployment with Azure Storage (SQLite on mounted file share)
# For Azure for Students Starter subscription - Works immediately!

set -e

echo "🚀 NovaMailer - Azure Deployment with Storage Mount"
echo "===================================================="
echo ""

# Configuration
RESOURCE_GROUP="novamailer"
LOCATION="eastus"
APP_SERVICE_PLAN="novamailer-plan"
BACKEND_APP="novamailer-backend"
FRONTEND_APP="novamailer-frontend"
STORAGE_ACCOUNT="novamailer$(date +%s | tail -c 8)"
SHARE_NAME="novamailerdata"

echo "📦 Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Storage Account: $STORAGE_ACCOUNT"
echo ""

# Check if resource group exists
if ! az group show --name $RESOURCE_GROUP &>/dev/null; then
    echo "Creating resource group..."
    az group create --name $RESOURCE_GROUP --location $LOCATION
    echo "✅ Resource group created"
else
    echo "✅ Resource group exists"
fi

# Create Storage Account
echo ""
echo "💾 Creating Storage Account..."
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

echo "✅ Storage account created"

# Get storage key
echo ""
echo "🔑 Getting storage key..."
STORAGE_KEY=$(az storage account keys list \
  --resource-group $RESOURCE_GROUP \
  --account-name $STORAGE_ACCOUNT \
  --query "[0].value" \
  --output tsv)

echo "✅ Storage key retrieved"

# Create file share
echo ""
echo "📁 Creating file share..."
az storage share create \
  --name $SHARE_NAME \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --quota 1

echo "✅ File share created"

# Check if App Service Plan exists
echo ""
echo "📋 Checking App Service Plan..."
if ! az appservice plan show --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP &>/dev/null; then
    echo "Creating App Service Plan..."
    az appservice plan create \
      --name $APP_SERVICE_PLAN \
      --resource-group $RESOURCE_GROUP \
      --location $LOCATION \
      --sku B1 \
      --is-linux
    echo "✅ App Service Plan created (B1 required for storage mount)"
else
    echo "✅ App Service Plan exists"
fi

# Create Backend Web App
echo ""
echo "🔧 Creating Backend Web App..."
if ! az webapp show --name $BACKEND_APP --resource-group $RESOURCE_GROUP &>/dev/null; then
    az webapp create \
      --resource-group $RESOURCE_GROUP \
      --plan $APP_SERVICE_PLAN \
      --name $BACKEND_APP \
      --runtime "PYTHON:3.11"
    echo "✅ Backend app created"
else
    echo "✅ Backend app exists"
fi

# Mount storage to backend
echo ""
echo "🔗 Mounting storage to backend..."
az webapp config storage-account add \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP \
  --custom-id NovaMailerData \
  --storage-type AzureFiles \
  --share-name $SHARE_NAME \
  --account-name $STORAGE_ACCOUNT \
  --access-key $STORAGE_KEY \
  --mount-path /data

echo "✅ Storage mounted to /data"

# Configure Backend
echo ""
echo "⚙️  Configuring Backend..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP \
  --settings \
    DATABASE_URL="sqlite+aiosqlite:////data/novamailer.db" \
    SECRET_KEY="your-secret-key-change-in-production" \
    SMTP_HOST="smtp.gmail.com" \
    SMTP_PORT="587" \
    SMTP_USER="your-email@gmail.com" \
    SMTP_PASSWORD="your-app-password" \
    FRONTEND_URL="https://${FRONTEND_APP}.azurewebsites.net" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true"

echo "✅ Backend configured"

# Deploy Backend
echo ""
echo "🚀 Deploying Backend..."
cd backend
zip -r ../backend.zip . -x "*.pyc" -x "__pycache__/*" -x "*.db"
cd ..

az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP \
  --src backend.zip

echo "✅ Backend deployed"

# Wait for backend to start
echo ""
echo "⏳ Waiting for backend to initialize..."
sleep 30

# Create Frontend Web App
echo ""
echo "🎨 Creating Frontend Web App..."
if ! az webapp show --name $FRONTEND_APP --resource-group $RESOURCE_GROUP &>/dev/null; then
    az webapp create \
      --resource-group $RESOURCE_GROUP \
      --plan $APP_SERVICE_PLAN \
      --name $FRONTEND_APP \
      --runtime "NODE:20-lts"
    echo "✅ Frontend app created"
else
    echo "✅ Frontend app exists"
fi

# Configure Frontend
echo ""
echo "⚙️  Configuring Frontend..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $FRONTEND_APP \
  --settings \
    NEXT_PUBLIC_API_URL="https://${BACKEND_APP}.azurewebsites.net"

# Build and Deploy Frontend
echo ""
echo "🚀 Building and Deploying Frontend..."
cd frontend
npm install
npm run build
zip -r ../frontend.zip .next package.json package-lock.json public -x "node_modules/*"
cd ..

az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $FRONTEND_APP \
  --src frontend.zip

echo "✅ Frontend deployed"

# Summary
echo ""
echo "✅ Deployment Complete!"
echo "======================="
echo ""
echo "🌐 URLs:"
echo "  Backend:  https://${BACKEND_APP}.azurewebsites.net"
echo "  Frontend: https://${FRONTEND_APP}.azurewebsites.net"
echo ""
echo "💾 Storage:"
echo "  Account: $STORAGE_ACCOUNT"
echo "  Share: $SHARE_NAME"
echo "  Database: /data/novamailer.db"
echo ""
echo "⚠️  Next Steps:"
echo "1. Update SMTP settings in Azure Portal"
echo "2. Change SECRET_KEY to a secure random value"
echo "3. Test backend: curl https://${BACKEND_APP}.azurewebsites.net/health"
echo ""
echo "💡 Note: Using B1 App Service Plan (~$13/month) for storage mount support"
echo ""
