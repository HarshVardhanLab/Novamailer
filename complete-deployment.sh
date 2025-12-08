#!/bin/bash

# Complete NovaMailer Deployment
# Use this after creating backend in Azure Portal

set -e

echo "🚀 Completing NovaMailer Deployment"
echo "===================================="
echo ""

RESOURCE_GROUP="novamailer"
BACKEND_APP="novamailer-backend"
FRONTEND_APP="novamailer-frontend"
APP_SERVICE_PLAN="novamailer-plan"

# Check if logged in
if ! az account show &> /dev/null; then
    echo "❌ Error: Not logged in to Azure"
    echo "Please run: az login"
    exit 1
fi

echo "📦 Resource Group: $RESOURCE_GROUP"
echo ""

# Get location
LOCATION=$(az group show --name $RESOURCE_GROUP --query location --output tsv)
echo "🌍 Location: $LOCATION"
echo ""

# Generate secret key
SECRET_KEY=$(openssl rand -hex 32)
echo "🔑 Generated secret key"
echo ""

# Configure backend settings
echo "🔧 Configuring backend settings..."
az webapp config appsettings set \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    DATABASE_URL="sqlite:///./data/novamailer.db" \
    SECRET_KEY="$SECRET_KEY" \
    CORS_ORIGINS="https://$FRONTEND_APP.azurewebsites.net" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
  --output none

echo "✅ Backend settings configured"
echo ""

# Set backend startup command
echo "🔧 Setting backend startup command..."
az webapp config set \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --startup-file "startup.sh" \
  --output none

echo "✅ Backend startup command set"
echo ""

# Deploy backend code
echo "📤 Deploying backend code..."
cd backend
echo "   Creating ZIP file..."
zip -r ../backend.zip . -x "venv/*" -x "__pycache__/*" -x "*.pyc" -x ".git/*" -x "*.db" > /dev/null
cd ..

echo "   Uploading to Azure..."
az webapp deployment source config-zip \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --src backend.zip \
  --output none

rm backend.zip
echo "✅ Backend deployed"
echo ""

# Get backend URL
BACKEND_URL=$(az webapp show \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostName \
  --output tsv)
BACKEND_URL="https://$BACKEND_URL"

echo "🔗 Backend URL: $BACKEND_URL"
echo ""

# Check if frontend app exists
if az webapp show --name $FRONTEND_APP --resource-group $RESOURCE_GROUP &>/dev/null; then
    echo "✅ Frontend app already exists"
else
    # Create frontend app
    echo "🚀 Creating frontend app..."
    az webapp create \
      --name $FRONTEND_APP \
      --resource-group $RESOURCE_GROUP \
      --plan $APP_SERVICE_PLAN \
      --runtime "NODE:18-lts" \
      --output none
    
    echo "✅ Frontend app created"
fi
echo ""

# Configure frontend settings
echo "🔧 Configuring frontend settings..."
az webapp config appsettings set \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NEXT_PUBLIC_API_URL="$BACKEND_URL" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
  --output none

echo "✅ Frontend settings configured"
echo ""

# Set frontend startup command
echo "🔧 Setting frontend startup command..."
az webapp config set \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --startup-file "npm install && npm run build && npm start" \
  --output none

echo "✅ Frontend startup command set"
echo ""

# Deploy frontend code
echo "📤 Deploying frontend code..."
cd frontend
echo "   Creating ZIP file..."
zip -r ../frontend.zip . -x "node_modules/*" -x ".next/*" -x ".git/*" > /dev/null
cd ..

echo "   Uploading to Azure..."
az webapp deployment source config-zip \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --src frontend.zip \
  --output none

rm frontend.zip
echo "✅ Frontend deployed"
echo ""

# Get frontend URL
FRONTEND_URL=$(az webapp show \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostName \
  --output tsv)
FRONTEND_URL="https://$FRONTEND_URL"

echo "🔗 Frontend URL: $FRONTEND_URL"
echo ""

# Update backend CORS with actual frontend URL
echo "🔧 Updating backend CORS..."
az webapp config appsettings set \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings CORS_ORIGINS="$FRONTEND_URL" \
  --output none

echo "✅ CORS updated"
echo ""

# Restart both apps
echo "🔄 Restarting apps..."
az webapp restart --name $BACKEND_APP --resource-group $RESOURCE_GROUP --output none &
az webapp restart --name $FRONTEND_APP --resource-group $RESOURCE_GROUP --output none &
wait

echo "✅ Apps restarted"
echo ""

# Save URLs
echo "Frontend: $FRONTEND_URL" > deployment-urls.txt
echo "Backend: $BACKEND_URL" >> deployment-urls.txt

# Display results
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "📱 Frontend URL: $FRONTEND_URL"
echo "🔧 Backend URL:  $BACKEND_URL"
echo ""
echo "URLs saved to: deployment-urls.txt"
echo ""
echo "⚠️  Note: Apps may take 2-3 minutes to fully start (Free tier)"
echo ""
echo "Next steps:"
echo "1. Wait 2-3 minutes for apps to start"
echo "2. Visit $FRONTEND_URL"
echo "3. Register your admin account"
echo "4. Configure SMTP settings"
echo ""
echo "To check deployment status:"
echo "  az webapp log tail --name $BACKEND_APP --resource-group $RESOURCE_GROUP"
echo ""
