# 🚀 Deploy NovaMailer - Azure App Service

Deploy NovaMailer using Azure App Service (compatible with Azure for Students Starter).

---

## ✅ Why App Service?

Your Azure for Students Starter subscription includes:
- ✅ **Azure App Service** (Microsoft.Web) - Allowed
- ❌ Container Registry - Not allowed
- ❌ Container Apps - Not allowed

So we'll use App Service instead - it's perfect for your subscription!

---

## ⚡ Quick Deploy

```bash
# Make script executable
chmod +x deploy-azure-appservice.sh

# Deploy
./deploy-azure-appservice.sh
```

**That's it!** Your app will be deployed in 10-15 minutes.

---

## 📋 What Will Be Created

In your `novamailer-rg` resource group:

1. **App Service Plan** (Free tier F1)
2. **Backend Web App** (Python 3.11)
3. **Frontend Web App** (Node.js 18)

---

## ⏱️ Deployment Timeline

- Create App Service Plan: 1 min
- Create Backend App: 1 min
- Deploy Backend Code: 3-5 min
- Create Frontend App: 1 min
- Deploy Frontend Code: 3-5 min
- **Total**: 10-15 minutes

---

## 📱 After Deployment

You'll see:

```
🎉 Deployment Complete!
=======================

📱 Frontend: https://novamailer-frontend.azurewebsites.net
🔧 Backend:  https://novamailer-backend.azurewebsites.net
```

**Note**: First request may take 1-2 minutes as apps start up (Free tier cold start).

---

## 🔧 Initial Setup

### 1. Register Admin Account
- Click on Frontend URL
- Go to "Register"
- Fill in your details
- Verify email with OTP

### 2. Configure SMTP
- Login to dashboard
- Go to Settings → SMTP Configuration
- Add email server details

### 3. Start Using
- Create templates
- Upload recipients
- Create campaigns
- Send emails!

---

## 📊 View Logs

```bash
# Backend logs
az webapp log tail \
  --name novamailer-backend \
  --resource-group novamailer-rg

# Frontend logs
az webapp log tail \
  --name novamailer-frontend \
  --resource-group novamailer-rg
```

---

## 🔄 Update Deployment

To update after making changes:

```bash
# Just run the script again
./deploy-azure-appservice.sh
```

---

## 💰 Cost

**Azure for Students Starter:**
- ✅ **Free tier** (F1) included
- ✅ No credit card required
- ✅ Perfect for learning and small projects

**Limitations:**
- Apps sleep after 20 minutes of inactivity
- First request after sleep takes 1-2 minutes
- 1 GB RAM, 1 GB storage per app

---

## 🐛 Troubleshooting

### Issue: "App name already exists"

The app names must be globally unique. Edit the script:

```bash
# In deploy-azure-appservice.sh, change:
BACKEND_APP="novamailer-backend-$(date +%s)"
FRONTEND_APP="novamailer-frontend-$(date +%s)"
```

### Issue: "Deployment failed"

```bash
# Check deployment logs
az webapp log tail --name novamailer-backend --resource-group novamailer-rg

# Check app status
az webapp show --name novamailer-backend --resource-group novamailer-rg
```

### Issue: "App is slow"

This is normal for Free tier:
- Apps sleep after 20 minutes of inactivity
- First request wakes up the app (1-2 minutes)
- Subsequent requests are fast

---

## 📝 Useful Commands

```bash
# List all web apps
az webapp list --resource-group novamailer-rg --output table

# Get app URL
az webapp show \
  --name novamailer-frontend \
  --resource-group novamailer-rg \
  --query defaultHostName

# Restart app
az webapp restart \
  --name novamailer-backend \
  --resource-group novamailer-rg

# View app settings
az webapp config appsettings list \
  --name novamailer-backend \
  --resource-group novamailer-rg
```

---

## 🎯 Upgrade Options

If you need better performance later:

### Basic Tier (B1) - ~$13/month
- Always on (no sleep)
- Custom domains
- SSL certificates
- 1.75 GB RAM

```bash
# Upgrade to Basic tier
az appservice plan update \
  --name novamailer-plan \
  --resource-group novamailer-rg \
  --sku B1
```

---

## ✅ Ready to Deploy!

Your deployment script is ready for Azure App Service.

**To deploy:**

```bash
./deploy-azure-appservice.sh
```

**Your app will be live in 10-15 minutes!** 🚀

---

**Subscription**: Azure for Students Starter
**Service**: Azure App Service (Free tier)
**Location**: Central India
**Estimated Time**: 10-15 minutes
**Cost**: FREE

---

**Last Updated**: December 2024
