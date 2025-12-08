#!/bin/bash
# Deploy backend to existing Azure resources

set -e

echo "🚀 Deploying Backend to Azure"
echo "=============================="

RESOURCE_GROUP="novamailer"
BACKEND_APP="novamailer-backend"
SQL_SERVER="novamailer-sql-1764566696"
SQL_DB="novamailer"
SQL_USER="novaadmin"
SQL_PASSWORD="NovaMailer2024!Secure"

# Build connection string
DATABASE_URL="mssql+aioodbc://${SQL_USER}:${SQL_PASSWORD}@${SQL_SERVER}.database.windows.net:1433/${SQL_DB}?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no"

echo "📝 Configuring app settings..."
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
    FRONTEND_URL="https://novamailer-frontend.azurewebsites.net" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true"

echo "✅ Settings configured"

# Package backend (exclude venv and unnecessary files)
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

# Deploy
echo ""
echo "🚀 Deploying to Azure..."
az webapp deploy \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP \
  --src-path backend.zip \
  --type zip

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🌐 Backend URL: https://${BACKEND_APP}.azurewebsites.net"
echo ""
echo "Test it:"
echo "curl https://${BACKEND_APP}.azurewebsites.net/health"
echo ""
