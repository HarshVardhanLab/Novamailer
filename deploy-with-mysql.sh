#!/bin/bash
# NovaMailer - Azure Deployment with MySQL Database
# For Azure for Students Starter subscription

set -e

echo "🚀 NovaMailer - Azure Deployment with MySQL"
echo "============================================"
echo ""

# Configuration
RESOURCE_GROUP="novamailer"
LOCATION="centralindia"
APP_SERVICE_PLAN="novamailer-plan"
BACKEND_APP="novamailer-backend"
FRONTEND_APP="novamailer-frontend"
MYSQL_SERVER="novamailer-db-$(date +%s)"
MYSQL_DB="novamailer"
MYSQL_USER="novaadmin"
MYSQL_PASSWORD="NovaMailer2024!Secure"

echo "📦 Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  MySQL Server: $MYSQL_SERVER"
echo "  Database: $MYSQL_DB"
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

# Create MySQL Flexible Server
echo ""
echo "🗄️  Creating MySQL Flexible Server..."
az mysql flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $MYSQL_SERVER \
  --location $LOCATION \
  --admin-user $MYSQL_USER \
  --admin-password "$MYSQL_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 20 \
  --version 8.0.21 \
  --public-access 0.0.0.0-255.255.255.255 \
  --yes

echo "✅ MySQL server created"

# Create database
echo ""
echo "🗄️  Creating database..."
az mysql flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $MYSQL_SERVER \
  --database-name $MYSQL_DB

echo "✅ Database created"

# Build MySQL connection string
DATABASE_URL="mysql+aiomysql://${MYSQL_USER}:${MYSQL_PASSWORD}@${MYSQL_SERVER}.mysql.database.azure.com:3306/${MYSQL_DB}"

echo ""
echo "📝 Database URL: mysql+aiomysql://${MYSQL_USER}:****@${MYSQL_SERVER}.mysql.database.azure.com:3306/${MYSQL_DB}"

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
    FRONTEND_URL="https://${FRONTEND_APP}.azurewebsites.net"

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
echo "  Server: ${MYSQL_SERVER}.mysql.database.azure.com"
echo "  Database: ${MYSQL_DB}"
echo "  User: ${MYSQL_USER}"
echo ""
echo "⚠️  Next Steps:"
echo "1. Update SMTP settings in Azure Portal"
echo "2. Change SECRET_KEY to a secure random value"
echo "3. Configure firewall rules if needed"
echo ""
