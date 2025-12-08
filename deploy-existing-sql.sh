#!/bin/bash
# NovaMailer - Deploy using EXISTING Azure SQL Database
# Uses the free database already created

set -e

echo "🚀 NovaMailer - Deploy with Existing SQL Database"
echo "=================================================="
echo ""

# Configuration - Using existing resources
RESOURCE_GROUP="novamailer"
LOCATION="centralindia"
APP_SERVICE_PLAN="novamailer-plan"
BACKEND_APP="novamailer-backend"
FRONTEND_APP="novamailer-frontend"
SQL_SERVER="novamailer-sql-1764566696"  # Existing server
SQL_DB="novamailer"  # Existing database
SQL_USER="novaadmin"
SQL_PASSWORD="NovaMailer2024!Secure"

echo "📦 Using Existing Resources:"
echo "  SQL Server: $SQL_SERVER"
echo "  Database: $SQL_DB (FREE tier)"
echo ""

# Build SQL Server connection string
DATABASE_URL="mssql+aioodbc://${SQL_USER}:${SQL_PASSWORD}@${SQL_SERVER}.database.windows.net:1433/${SQL_DB}?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no"

# Check if App Service Plan exists
echo "📋 Checking App Service Plan..."
if ! az appservice plan show --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP &>/dev/null; then
    echo "Creating App Service Plan (F1 Free)..."
    az appservice plan create \
      --name $APP_SERVICE_PLAN \
      --resource-group $RESOURCE_GROUP \
      --location $LOCATION \
      --sku F1 \
      --is-linux
    echo "✅ App Service Plan created"
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

# Configure Backend
echo ""
echo "⚙️  Configuring Backend..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP \
  --settings \
    DATABASE_URL="$DATABASE_URL" \
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

# Wait for backend
echo ""
echo "⏳ Waiting for backend to start..."
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
echo "🗄️  Database:"
echo "  Server: ${SQL_SERVER}.database.windows.net"
echo "  Database: ${SQL_DB} (FREE - 32MB)"
echo "  User: ${SQL_USER}"
echo ""
echo "💰 Cost: FREE (F1 App Service + Free SQL Database)"
echo ""
echo "⚠️  Next Steps:"
echo "1. Update SMTP settings in Azure Portal"
echo "2. Change SECRET_KEY to a secure random value"
echo "3. Test: curl https://${BACKEND_APP}.azurewebsites.net/health"
echo ""
