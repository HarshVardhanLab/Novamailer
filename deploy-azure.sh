#!/bin/bash

# NovaMailer - Azure Deployment Script
# Automated deployment to Azure Container Apps

set -e

echo "🚀 NovaMailer - Azure Deployment"
echo "================================="
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
ACR_NAME="novamailer$(date +%s)"
ENVIRONMENT_NAME="novamailer-env"

echo "📦 Resource Group: $RESOURCE_GROUP"

# Check if resource group exists and get its location
if az group show --name $RESOURCE_GROUP &>/dev/null; then
    LOCATION=$(az group show --name $RESOURCE_GROUP --query location --output tsv)
    echo "✅ Using existing resource group"
    echo "🌍 Location: $LOCATION (from existing resource group)"
else
    # Use Southeast Asia as default if creating new resource group
    LOCATION="${LOCATION:-southeastasia}"
    echo "🌍 Location: $LOCATION"
    echo "🔧 Creating resource group..."
    az group create \
      --name $RESOURCE_GROUP \
      --location $LOCATION \
      --output none
    echo "✅ Resource group created"
fi

echo "📦 Registry: $ACR_NAME"
echo ""

# Create Container Registry
echo "🔧 Creating Azure Container Registry..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true \
  --output none

ACR_LOGIN_SERVER=$(az acr show \
  --name $ACR_NAME \
  --resource-group $RESOURCE_GROUP \
  --query loginServer \
  --output tsv)

echo "✅ Container Registry created: $ACR_LOGIN_SERVER"
echo ""

# Build and push backend
echo "🏗️  Building backend image..."
az acr build \
  --registry $ACR_NAME \
  --image novamailer-backend:latest \
  --file backend/Dockerfile.prod \
  ./backend \
  --output none
echo "✅ Backend image built and pushed"
echo ""

# Build and push frontend
echo "🏗️  Building frontend image (this may take a few minutes)..."
az acr build \
  --registry $ACR_NAME \
  --image novamailer-frontend:latest \
  --file frontend/Dockerfile.prod \
  ./frontend \
  --output none
echo "✅ Frontend image built and pushed"
echo ""

# Install Container Apps extension
echo "🔧 Setting up Container Apps..."
az extension add --name containerapp --upgrade --only-show-errors 2>/dev/null || true

# Register providers
az provider register --namespace Microsoft.App --wait
az provider register --namespace Microsoft.OperationalInsights --wait

# Create Container Apps environment
echo "🔧 Creating Container Apps environment..."
az containerapp env create \
  --name $ENVIRONMENT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --output none
echo "✅ Environment created"
echo ""

# Get ACR credentials
ACR_USERNAME=$(az acr credential show \
  --name $ACR_NAME \
  --query username \
  --output tsv)

ACR_PASSWORD=$(az acr credential show \
  --name $ACR_NAME \
  --query passwords[0].value \
  --output tsv)

# Generate secret key
SECRET_KEY=$(openssl rand -hex 32)

# Deploy backend
echo "🚀 Deploying backend to Azure Container Apps..."
az containerapp create \
  --name novamailer-backend \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT_NAME \
  --image $ACR_LOGIN_SERVER/novamailer-backend:latest \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 8000 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 10 \
  --cpu 0.5 \
  --memory 1Gi \
  --env-vars \
    DATABASE_URL="sqlite:///./data/novamailer.db" \
    SECRET_KEY="$SECRET_KEY" \
    CORS_ORIGINS="https://novamailer-frontend.*" \
  --output none

BACKEND_FQDN=$(az containerapp show \
  --name novamailer-backend \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn \
  --output tsv)

BACKEND_URL="https://$BACKEND_FQDN"
echo "✅ Backend deployed at: $BACKEND_URL"
echo ""

# Deploy frontend
echo "🚀 Deploying frontend to Azure Container Apps..."
az containerapp create \
  --name novamailer-frontend \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT_NAME \
  --image $ACR_LOGIN_SERVER/novamailer-frontend:latest \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 3000 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 10 \
  --cpu 0.5 \
  --memory 1Gi \
  --env-vars \
    NEXT_PUBLIC_API_URL="$BACKEND_URL" \
  --output none

FRONTEND_FQDN=$(az containerapp show \
  --name novamailer-frontend \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn \
  --output tsv)

FRONTEND_URL="https://$FRONTEND_FQDN"
echo "✅ Frontend deployed at: $FRONTEND_URL"
echo ""

# Update backend CORS
echo "🔧 Updating backend CORS..."
az containerapp update \
  --name novamailer-backend \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars CORS_ORIGINS="$FRONTEND_URL" \
  --output none
echo "✅ CORS updated"
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
echo "Next steps:"
echo "1. Visit $FRONTEND_URL to access your application"
echo "2. Register your admin account"
echo "3. Configure SMTP settings in the app"
echo ""
echo "To view logs:"
echo "  az containerapp logs show --name novamailer-backend --resource-group $RESOURCE_GROUP --follow"
echo "  az containerapp logs show --name novamailer-frontend --resource-group $RESOURCE_GROUP --follow"
echo ""
