# 🚀 Deploy NovaMailer to Azure - Your Subscription

Quick deployment guide for your Azure subscription with region restrictions.

---

## 🌍 Allowed Regions

Your Azure subscription allows deployment to these regions only:
- ✅ **southeastasia** (Southeast Asia) - Default
- ✅ **malaysiawest** (Malaysia West)
- ✅ **centralindia** (Central India)
- ✅ **eastasia** (East Asia)
- ✅ **koreacentral** (Korea Central)

---

## ⚡ Quick Deploy (3 Steps)

### Step 1: Login to Azure

```bash
az login
```

### Step 2: Choose Your Region (Optional)

The script uses **Southeast Asia** by default. To use a different region:

```bash
# Option 1: Southeast Asia (Default - Recommended)
export LOCATION=southeastasia

# Option 2: Malaysia West
export LOCATION=malaysiawest

# Option 3: Central India
export LOCATION=centralindia

# Option 4: East Asia
export LOCATION=eastasia

# Option 5: Korea Central
export LOCATION=koreacentral
```

### Step 3: Deploy

```bash
chmod +x deploy-azure.sh
./deploy-azure.sh
```

---

## 📋 Complete Deployment Command

Copy and paste this entire block:

```bash
#!/bin/bash

# Login to Azure
az login

# Set region (Southeast Asia - closest to most locations)
export LOCATION=southeastasia

# Deploy
chmod +x deploy-azure.sh
./deploy-azure.sh
```

---

## 🌏 Region Recommendations

### Southeast Asia (southeastasia) - Recommended ⭐
- **Location**: Singapore
- **Best for**: Global access, good latency worldwide
- **Latency**: Low to medium globally

### Malaysia West (malaysiawest)
- **Location**: Malaysia
- **Best for**: Southeast Asian users
- **Latency**: Very low in SEA, medium elsewhere

### Central India (centralindia)
- **Location**: Pune, India
- **Best for**: Indian subcontinent users
- **Latency**: Very low in India, medium elsewhere

### East Asia (eastasia)
- **Location**: Hong Kong
- **Best for**: East Asian users
- **Latency**: Very low in East Asia, medium elsewhere

### Korea Central (koreacentral)
- **Location**: Seoul, South Korea
- **Best for**: Korean and nearby users
- **Latency**: Very low in Korea, medium elsewhere

---

## 🎯 What Happens During Deployment

1. ✅ Creates resource group in your chosen region
2. ✅ Creates Azure Container Registry
3. ✅ Builds backend Docker image (~3-5 min)
4. ✅ Builds frontend Docker image (~5-8 min)
5. ✅ Pushes images to registry
6. ✅ Creates Container Apps environment
7. ✅ Deploys backend
8. ✅ Deploys frontend
9. ✅ Configures CORS

**Total Time**: 15-20 minutes

---

## 📱 After Deployment

You'll see:

```
🎉 Deployment Complete!
=======================

📱 Frontend: https://novamailer-frontend.xxx.southeastasia.azurecontainerapps.io
🔧 Backend:  https://novamailer-backend.xxx.southeastasia.azurecontainerapps.io
```

**Click the Frontend URL to access your application!**

---

## 🔧 Initial Setup

### 1. Register Admin Account
- Go to Frontend URL
- Click "Register"
- Fill in your details
- Verify email with OTP

### 2. Configure SMTP
- Login to dashboard
- Go to Settings → SMTP Configuration
- Add your email server details:
  - **Gmail**: smtp.gmail.com, port 587
  - **Outlook**: smtp.office365.com, port 587
  - **SendGrid**: smtp.sendgrid.net, port 587

### 3. Start Using
- Create email templates
- Upload recipients (CSV)
- Create campaigns
- Send emails!

---

## 📊 View Logs

```bash
# Backend logs
az containerapp logs show \
  --name novamailer-backend \
  --resource-group novamailer-rg \
  --follow

# Frontend logs
az containerapp logs show \
  --name novamailer-frontend \
  --resource-group novamailer-rg \
  --follow
```

---

## 🔄 Update Deployment

To update after making changes:

```bash
# Just run the script again
./deploy-azure.sh
```

---

## 💰 Cost Estimate

### Free Tier (Monthly)
- 180,000 vCPU-seconds
- 360,000 GiB-seconds

### Typical Costs
- **Small usage** (< 10k emails/month): **$0-10/month**
- **Medium usage** (100k emails/month): **$20-40/month**

Most users stay within the free tier! 🎉

---

## 🐛 Troubleshooting

### Issue: "Region not allowed"

Make sure you're using one of the allowed regions:
```bash
export LOCATION=southeastasia
./deploy-azure.sh
```

### Issue: "CORS error"

```bash
# Get frontend URL
FRONTEND_URL=$(az containerapp show \
  --name novamailer-frontend \
  --resource-group novamailer-rg \
  --query properties.configuration.ingress.fqdn \
  --output tsv)

# Update backend
az containerapp update \
  --name novamailer-backend \
  --resource-group novamailer-rg \
  --set-env-vars CORS_ORIGINS="https://$FRONTEND_URL"
```

### Issue: "Subscription not found"

```bash
# List subscriptions
az account list --output table

# Set subscription
az account set --subscription "YOUR_SUBSCRIPTION_NAME"
```

---

## 📝 Useful Commands

```bash
# List all apps
az containerapp list --resource-group novamailer-rg --output table

# Get app URLs
az containerapp show \
  --name novamailer-frontend \
  --resource-group novamailer-rg \
  --query properties.configuration.ingress.fqdn

# View app details
az containerapp show \
  --name novamailer-backend \
  --resource-group novamailer-rg

# Delete everything
az group delete --name novamailer-rg --yes
```

---

## ✅ Deployment Checklist

- [ ] Azure CLI installed
- [ ] Logged in to Azure (`az login`)
- [ ] Region selected (default: southeastasia)
- [ ] Run deployment script
- [ ] Frontend URL accessible
- [ ] Backend URL accessible
- [ ] Register admin account
- [ ] Verify email with OTP
- [ ] Configure SMTP settings
- [ ] Test email sending

---

## 🎉 Ready to Deploy!

Your deployment script is now configured for your Azure subscription.

**To deploy:**

```bash
az login
export LOCATION=southeastasia  # or your preferred allowed region
./deploy-azure.sh
```

**Your app will be live in 15-20 minutes!** 🚀

---

**Subscription**: d9c7b81e-1c4a-4e71-a5be-aba8f9969231
**Allowed Regions**: Southeast Asia, Malaysia West, Central India, East Asia, Korea Central
**Default Region**: Southeast Asia (Singapore)
**Estimated Time**: 15-20 minutes
**Cost**: Free tier available

---

**Last Updated**: December 2024
