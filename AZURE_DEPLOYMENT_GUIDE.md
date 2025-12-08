# 🚀 NovaMailer - Azure Deployment Guide

Complete guide to deploy NovaMailer on Microsoft Azure.

---

## 📋 Prerequisites

### 1. Azure Account
- [ ] Azure account created
- [ ] Active subscription
- [ ] Resource group created (or will create during deployment)

### 2. Local Tools (Optional - can use Azure Cloud Shell)
- [ ] [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed
- [ ] Docker installed (if deploying locally)

---

## 🎯 Deployment Options

### Option 1: Azure Container Apps (Recommended) ⭐

**Best for**: Auto-scaling, serverless, cost-effective

**Features**:
- Auto-scaling (0 to many instances)
- Pay only for what you use
- Built-in HTTPS
- Easy to manage

### Option 2: Azure App Service

**Best for**: Traditional web apps, more control

**Features**:
- Always-on instances
- Easy deployment
- Built-in CI/CD
- Custom domains

### Option 3: Azure Kubernetes Service (AKS)

**Best for**: Large scale, complex deployments

**Features**:
- Full Kubernetes control
- Advanced networking
- High availability

---

## ⚡ Quick Start - Azure Container Apps (Recommended)

### Step 1: Login to Azure

```bash
# Login
az login

# Set subscription (if you have multiple)
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Verify
az account show
```

### Step 2: Create Resource Group

```bash
# Set variables
RESOURCE_GROUP="novamailer-rg"
LOCATION="eastus"  # or your preferred location

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

echo "✅ Resource group created"
```

### Step 3: Create Container Registry

```bash
# Set registry name (must be globally unique)
ACR_NAME="novamailer$(date +%s)"

# Create Azure Container Registry
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true

# Get login server
ACR_LOGIN_SERVER=$(az acr show \
  --name $ACR_NAME \
  --resource-group $RESOURCE_GROUP \
  --query loginServer \
  --output tsv)

echo "✅ Container Registry created: $ACR_LOGIN_SERVER"
```

### Step 4: Build and Push Images

```bash
# Login to ACR
az acr login --name $ACR_NAME

# Build and push backend
az acr build \
  --registry $ACR_NAME \
  --image novamailer-backend:latest \
  --file backend/Dockerfile.prod \
  ./backend

# Build and push frontend
az acr build \
  --registry $ACR_NAME \
  --image novamailer-frontend:latest \
  --file frontend/Dockerfile.prod \
  ./frontend

echo "✅ Images built and pushed"
```

### Step 5: Create Container Apps Environment

```bash
# Install Container Apps extension
az extension add --name containerapp --upgrade

# Register providers
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights

# Create environment
ENVIRONMENT_NAME="novamailer-env"

az containerapp env create \
  --name $ENVIRONMENT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

echo "✅ Container Apps environment created"
```

### Step 6: Deploy Backend

```bash
# Generate secret key
SECRET_KEY=$(openssl rand -hex 32)

# Get ACR credentials
ACR_USERNAME=$(az acr credential show \
  --name $ACR_NAME \
  --query username \
  --output tsv)

ACR_PASSWORD=$(az acr credential show \
  --name $ACR_NAME \
  --query passwords[0].value \
  --output tsv)

# Deploy backend
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
    CORS_ORIGINS="https://novamailer-frontend.*"

# Get backend URL
BACKEND_URL=$(az containerapp show \
  --name novamailer-backend \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn \
  --output tsv)

BACKEND_URL="https://$BACKEND_URL"

echo "✅ Backend deployed at: $BACKEND_URL"
```

### Step 7: Deploy Frontend

```bash
# Deploy frontend
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
    NEXT_PUBLIC_API_URL="$BACKEND_URL"

# Get frontend URL
FRONTEND_URL=$(az containerapp show \
  --name novamailer-frontend \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn \
  --output tsv)

FRONTEND_URL="https://$FRONTEND_URL"

echo "✅ Frontend deployed at: $FRONTEND_URL"
```

### Step 8: Update Backend CORS

```bash
# Update backend with correct CORS
az containerapp update \
  --name novamailer-backend \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars CORS_ORIGINS="$FRONTEND_URL"

echo "✅ CORS updated"
```

### Step 9: Display Results

```bash
echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "📱 Frontend: $FRONTEND_URL"
echo "🔧 Backend:  $BACKEND_URL"
echo ""
echo "Next steps:"
echo "1. Visit $FRONTEND_URL to access your application"
echo "2. Register your admin account"
echo "3. Configure SMTP settings"
echo ""
```

---

## 🗄️ Database Options

### Option 1: SQLite (Default - Good for Testing)

Already configured. Data stored in container (not persistent across restarts).

### Option 2: Azure Database for PostgreSQL (Recommended for Production)

```bash
# Create PostgreSQL server
POSTGRES_SERVER="novamailer-db-$(date +%s)"
POSTGRES_ADMIN="novaadmin"
POSTGRES_PASSWORD="YourSecurePassword123!"

az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER \
  --location $LOCATION \
  --admin-user $POSTGRES_ADMIN \
  --admin-password $POSTGRES_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 15

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $POSTGRES_SERVER \
  --database-name novamailer

# Get connection string
POSTGRES_HOST="$POSTGRES_SERVER.postgres.database.azure.com"
DATABASE_URL="postgresql://$POSTGRES_ADMIN:$POSTGRES_PASSWORD@$POSTGRES_HOST:5432/novamailer"

# Update backend
az containerapp update \
  --name novamailer-backend \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars DATABASE_URL="$DATABASE_URL"

echo "✅ PostgreSQL configured"
```

---

## 📊 Monitoring & Logging

### View Logs

```bash
# Backend logs
az containerapp logs show \
  --name novamailer-backend \
  --resource-group $RESOURCE_GROUP \
  --follow

# Frontend logs
az containerapp logs show \
  --name novamailer-frontend \
  --resource-group $RESOURCE_GROUP \
  --follow
```

### View Metrics

```bash
# List revisions
az containerapp revision list \
  --name novamailer-backend \
  --resource-group $RESOURCE_GROUP

# Show app details
az containerapp show \
  --name novamailer-backend \
  --resource-group $RESOURCE_GROUP
```

---

## 🔄 Update Deployment

### Update Backend

```bash
# Rebuild and push image
az acr build \
  --registry $ACR_NAME \
  --image novamailer-backend:latest \
  --file backend/Dockerfile.prod \
  ./backend

# Update container app
az containerapp update \
  --name novamailer-backend \
  --resource-group $RESOURCE_GROUP \
  --image $ACR_LOGIN_SERVER/novamailer-backend:latest
```

### Update Frontend

```bash
# Rebuild and push image
az acr build \
  --registry $ACR_NAME \
  --image novamailer-frontend:latest \
  --file frontend/Dockerfile.prod \
  ./frontend

# Update container app
az containerapp update \
  --name novamailer-frontend \
  --resource-group $RESOURCE_GROUP \
  --image $ACR_LOGIN_SERVER/novamailer-frontend:latest
```

---

## 🌐 Custom Domain

```bash
# Add custom domain to frontend
az containerapp hostname add \
  --name novamailer-frontend \
  --resource-group $RESOURCE_GROUP \
  --hostname your-domain.com

# Add custom domain to backend
az containerapp hostname add \
  --name novamailer-backend \
  --resource-group $RESOURCE_GROUP \
  --hostname api.your-domain.com
```

---

## 💰 Cost Estimation

### Azure Container Apps Pricing

**Free Tier**:
- 180,000 vCPU-seconds
- 360,000 GiB-seconds

**Estimated Monthly Cost**:
- Small usage (< 10k requests): **$0-10**
- Medium usage (100k requests): **$20-40**
- Large usage (1M requests): **$100-200**

**Azure Database for PostgreSQL**:
- Burstable B1ms: **~$12/month**
- General Purpose D2s_v3: **~$100/month**

---

## 🐛 Troubleshooting

### Issue: "Container failed to start"

```bash
# Check logs
az containerapp logs show \
  --name novamailer-backend \
  --resource-group $RESOURCE_GROUP \
  --tail 50

# Check revision status
az containerapp revision list \
  --name novamailer-backend \
  --resource-group $RESOURCE_GROUP
```

### Issue: "CORS error"

```bash
# Get frontend URL
FRONTEND_URL=$(az containerapp show \
  --name novamailer-frontend \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn \
  --output tsv)

# Update backend CORS
az containerapp update \
  --name novamailer-backend \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars CORS_ORIGINS="https://$FRONTEND_URL"
```

### Issue: "Image pull failed"

```bash
# Check ACR credentials
az acr credential show --name $ACR_NAME

# Update container app with new credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value --output tsv)

az containerapp update \
  --name novamailer-backend \
  --resource-group $RESOURCE_GROUP \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD
```

---

## 🗑️ Clean Up

To delete everything:

```bash
# Delete resource group (deletes everything)
az group delete \
  --name $RESOURCE_GROUP \
  --yes \
  --no-wait

echo "✅ Resources deleted"
```

---

## 📝 Useful Commands

```bash
# List all container apps
az containerapp list --resource-group $RESOURCE_GROUP --output table

# Get app URL
az containerapp show \
  --name APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn

# Scale app
az containerapp update \
  --name APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --min-replicas 1 \
  --max-replicas 5

# Update environment variable
az containerapp update \
  --name APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars KEY=VALUE

# Restart app
az containerapp revision restart \
  --name APP_NAME \
  --resource-group $RESOURCE_GROUP
```

---

## ✅ Post-Deployment Checklist

- [ ] Frontend accessible
- [ ] Backend accessible
- [ ] Register admin account
- [ ] Email verification works
- [ ] Login successful
- [ ] Configure SMTP
- [ ] Test email sending
- [ ] All features working
- [ ] CORS configured
- [ ] HTTPS working
- [ ] Logs accessible

---

## 📞 Support & Resources

### Azure Documentation
- [Container Apps Docs](https://docs.microsoft.com/en-us/azure/container-apps/)
- [Azure CLI Reference](https://docs.microsoft.com/en-us/cli/azure/)
- [Azure Database for PostgreSQL](https://docs.microsoft.com/en-us/azure/postgresql/)

### NovaMailer Documentation
- `AZURE_QUICK_START.md` - Quick start guide
- `USER_GUIDE.md` - Application user guide
- `OTP_FINAL_SUMMARY.md` - OTP system details

---

**Last Updated**: November 2024
**Version**: 1.0.0
