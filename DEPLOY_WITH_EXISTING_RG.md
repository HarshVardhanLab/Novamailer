# 🚀 Deploy NovaMailer - Using Existing Resource Group

Deploy NovaMailer using your existing `novamailer-rg` resource group in UK South.

---

## ✅ Your Setup

- **Resource Group**: `novamailer-rg`
- **Location**: `UK South` (uksouth)
- **Subscription**: Azure for Students Starter

The deployment script will automatically detect and use your existing resource group!

---

## ⚡ Quick Deploy

```bash
# Just run the script - it will use your existing resource group
./deploy-azure.sh
```

That's it! The script will:
1. ✅ Detect your existing resource group
2. ✅ Use UK South location automatically
3. ✅ Deploy everything to your resource group

---

## 📋 What Will Be Created

In your existing `novamailer-rg` resource group:

1. **Azure Container Registry** - Stores Docker images
2. **Container Apps Environment** - Hosting environment
3. **Backend Container App** - FastAPI backend
4. **Frontend Container App** - Next.js frontend

---

## ⏱️ Deployment Timeline

- **Build Backend**: 3-5 minutes
- **Build Frontend**: 5-8 minutes
- **Deploy Services**: 3-5 minutes
- **Total**: 15-20 minutes

---

## 📱 After Deployment

You'll see:

```
🎉 Deployment Complete!
=======================

📱 Frontend: https://novamailer-frontend.xxx.uksouth.azurecontainerapps.io
🔧 Backend:  https://novamailer-backend.xxx.uksouth.azurecontainerapps.io
```

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
- Add email server details:
  - **Gmail**: smtp.gmail.com, port 587
  - **Outlook**: smtp.office365.com, port 587

### 3. Start Using
- Create templates
- Upload recipients
- Create campaigns
- Send emails!

---

## 📊 View Your Resources

After deployment, check Azure Portal:
- Go to: https://portal.azure.com
- Navigate to: Resource Groups → novamailer-rg
- You'll see all deployed resources

---

## 📝 View Logs

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

## 💰 Cost

With Azure for Students Starter:
- **Free Credits**: $100 credit
- **Container Apps**: Free tier available
- **Typical Usage**: $0-10/month (within free tier)

---

## 🐛 Troubleshooting

### Issue: "Build failed"

```bash
# Check if Docker is running
docker ps

# Check Azure CLI is logged in
az account show
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

---

## ✅ Ready to Deploy!

Your script is configured to use your existing resource group.

**To deploy:**

```bash
./deploy-azure.sh
```

**Your app will be live in 15-20 minutes!** 🚀

---

**Resource Group**: novamailer-rg
**Location**: UK South
**Subscription**: Azure for Students Starter
**Estimated Time**: 15-20 minutes
