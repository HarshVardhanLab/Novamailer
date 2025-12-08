#!/bin/bash
# Complete fresh deployment with Azure SQL Database
# For Azure for Students Starter subscription

set -e

echo "🚀 NovaMailer - Fresh Deployment"
echo "================================="
echo ""

# Configuration
RESOURCE_GROUP="novamailer"
LOCATION="centralindia"
APP_SERVICE_PLAN="novamailer-plan"
BACKEND_APP="novamailer-backend"
FRONTEND_APP="novamailer-frontend"
SQL_SERVER="novamailer-sql-$(date +%s)"
SQL_DB="novamailer"
SQL_USER="novaadmin"
SQL_PASSWORD="NovaMailer2024!Secure"

echo "📦 Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  SQL Server: $SQL_SERVER"
echo ""

# Create resource group
echo "📁 Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION
echo "✅ Resource group created"

# Create SQL Server
echo ""
echo "🗄️  Creating Azure SQL Server..."
az sql server create \
  --resource-group $RESOURCE_GROUP \
  --name $SQL_SERVER \
  --location $LOCATION \
  --admin-user $SQL_USER \
  --admin-password "$SQL_PASSWORD"

echo "✅ SQL server created"

# Configure firewall
echo ""
echo "🔥 Configuring firewall..."
az sql server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

echo "✅ Firewall configured"

# Create FREE database
echo ""
echo "🗄️  Creating FREE database..."
az sql db create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER \
  --name $SQL_DB \
  --edition Free \
  --backup-storage-redundancy Local

echo "✅ Database created (FREE - 32MB)"

# Build connection string
DATABASE_URL="mssql+aioodbc://${SQL_USER}:${SQL_PASSWORD}@${SQL_SERVER}.database.windows.net:1433/${SQL_DB}?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no"

# Create App Service Plan (F1 Free)
echo ""
echo "📋 Creating App Service Plan (F1 Free)..."
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku F1 \
  --is-linux

echo "✅ App Service Plan created"

# Create Backend Web App
echo ""
echo "🔧 Creating Backend Web App..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $BACKEND_APP \
  --runtime "PYTHON:3.11"

echo "✅ Backend app created"

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

# Package and Deploy Backend
echo ""
echo "📦 Packaging backend..."
cd backend
rm -f ../backend.zip
zip -r ../backend.zip . \
  -x "venv/*" \
  -x "*.pyc" \
  -x "__pycache__/*" \
  -x "*.db" \
  -x ".git/*" \
  -x ".venv/*" \
  -x "env/*"
cd ..

echo "✅ Package created"

echo ""
echo "🚀 Deploying backend..."
az webapp deploy \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP \
  --src-path backend.zip \
  --type zip

echo "✅ Backend deployed"

# Wait for backend to be ready
echo ""
echo "⏳ Waiting for backend to start..."
sleep 30

# Create Frontend Web App
echo ""
echo "🎨 Creating Frontend Web App..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $FRONTEND_APP \
  --runtime "NODE:20-lts"

echo "✅ Frontend app created"

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
echo "🏗️  Building frontend..."
cd frontend
npm install
npm run build

echo ""
echo "📦 Packaging frontend..."
zip -r ../frontend.zip .next package.json package-lock.json public -x "node_modules/*"
cd ..

echo ""
echo "🚀 Deploying frontend..."
az webapp deploy \
  --resource-group $RESOURCE_GROUP \
  --name $FRONTEND_APP \
  --src-path frontend.zip \
  --type zip

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
echo "💰 Cost: FREE"
echo "  - F1 App Service Plan: Free"
echo "  - Azure SQL Database: Free tier"
echo ""
echo "⚠️  Next Steps:"
echo "1. Update SMTP settings in Azure Portal"
echo "2. Change SECRET_KEY to a secure random value"
echo "3. Test backend: curl https://${BACKEND_APP}.azurewebsites.net/health"
echo ""
echo "⚠️  Note: F1 Free tier has quotas (60 CPU min/day)"
echo "If you hit quota limits, upgrade to B1 (~$13/month)"
echo ""
