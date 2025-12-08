#!/bin/bash
# NovaMailer - Azure Deployment with Azure SQL Database
# For Azure for Students Starter subscription

set -e

echo "🚀 NovaMailer - Azure Deployment with Azure SQL"
echo "==============================================="
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
echo "  Database: $SQL_DB"
echo ""

# Check if resource group exists
if ! az group show --name $RESOURCE_GROUP &>/dev/null; then
    echo "❌ Resource group '$RESOURCE_GROUP' not found!"
    echo "Creating resource group..."
    az group create --name $RESOURCE_GROUP --location $LOCATION
    echo "✅ Resource group created"
else
    echo "✅ Resource group exists"
fi

# Create Azure SQL Server
echo ""
echo "🗄️  Creating Azure SQL Server..."
az sql server create \
  --resource-group $RESOURCE_GROUP \
  --name $SQL_SERVER \
  --location $LOCATION \
  --admin-user $SQL_USER \
  --admin-password "$SQL_PASSWORD"

echo "✅ SQL server created"

# Configure firewall to allow Azure services
echo ""
echo "🔥 Configuring firewall..."
az sql server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

echo "✅ Firewall configured"

# Create database (FREE tier for DreamSpark/Students)
echo ""
echo "🗄️  Creating database (FREE tier)..."
az sql db create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER \
  --name $SQL_DB \
  --edition Free \
  --backup-storage-redundancy Local

echo "✅ Database created"

# Build SQL Server connection string
DATABASE_URL="mssql+aioodbc://${SQL_USER}:${SQL_PASSWORD}@${SQL_SERVER}.database.windows.net:1433/${SQL_DB}?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no"

echo ""
echo "📝 Database URL configured"

# Check if App Service Plan exists
echo ""
echo "📋 Checking App Service Plan..."
if ! az appservice plan show --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP &>/dev/null; then
    echo "Creating App Service Plan..."
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
echo "  Database: ${SQL_DB}"
echo "  User: ${SQL_USER}"
echo ""
echo "⚠️  Next Steps:"
echo "1. Update SMTP settings in Azure Portal"
echo "2. Change SECRET_KEY to a secure random value"
echo "3. Test backend: curl https://${BACKEND_APP}.azurewebsites.net/health"
echo ""
