# 🚀 NovaMailer - Azure Quick Start

Deploy NovaMailer to Microsoft Azure in 3 steps!

---

## ⚡ Super Quick Deployment

### Step 1: Install Azure CLI (if not installed)

**macOS:**
```bash
brew install azure-cli
```

**Windows:**
Download from: https://aka.ms/installazurecliwindows

**Linux:**
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Step 2: Login to Azure

```bash
# Login
az login

# Set subscription (if you have multiple)
az account list --output table
az account set --subscription "YOUR_SUBSCRIPTION_NAME"
```

### Step 3: Deploy

```bash
# Make script executable
chmod +x deploy-azure.sh

# Run deployment (uses Southeast Asia by default)
./deploy-azure.sh
```

**That's it!** ✨

---

## 🌍 Region Selection

The script uses **Southeast Asia** by default. To use a different region:

```bash
# Choose your region
export LOCATION=southeastasia  # Singapore (Default)
# OR
export LOCATION=malaysiawest   # Malaysia
# OR
export LOCATION=centralindia   # India
# OR
export LOCATION=eastasia       # Hong Kong
# OR
export LOCATION=koreacentral   # Seoul

# Then deploy
./deploy-azure.sh
```

---

## 📋 What the Script Does

1. ✅ Creates resource group
2. ✅ Creates Azure Container Registry
3. ✅ Builds Docker images
4. ✅ Pushes images to registry
5. ✅ Creates Container Apps environment
6. ✅ Deploys backend
7. ✅ Deploys frontend
8. ✅ Configures CORS
9. ✅ Provides URLs

**Time**: 15-20 minutes

---

## 📱 Access Your App

After deployment, you'll see:

```
🎉 Deployment Complete!
=======================

📱 Frontend: https://novamailer-frontend.xxx.eastus.azurecontainerapps.io
🔧 Backend:  https://novamailer-backend.xxx.eastus.azurecontainerapps.io
```

**Click the Frontend URL to access your application!**

---

## 🔧 Initial Setup

### 1. Register Admin Account
- Go to Frontend URL
- Click "Register"
- Fill in details
- Verify email with OTP

### 2. Configure SMTP
- Login to dashboard
- Go to Settings → SMTP
- Add email server details
- Test email sending

### 3. Start Using
- Create templates
- Upload recipients
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

```bash
# Just run the script again
./deploy-azure.sh
```

---

## 💰 Cost Estimate

### Free Tier (Monthly):
- 180,000 vCPU-seconds
- 360,000 GiB-seconds

### Typical Cost:
- **Small usage**: $0-10/month
- **Medium usage**: $20-40/month
- **Large usage**: $100-200/month

Most users stay within free tier! 🎉

---

## 🐛 Common Issues

### Issue: "Not logged in"

```bash
az login
```

### Issue: "Subscription not found"

```bash
# List subscriptions
az account list --output table

# Set subscription
az account set --subscription "YOUR_SUBSCRIPTION_NAME"
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

## 📝 Useful Commands

```bash
# List all apps
az containerapp list --resource-group novamailer-rg --output table

# Get app URL
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

## 🎯 Next Steps

1. ✅ Deploy (done!)
2. ✅ Register account
3. ✅ Configure SMTP
4. ⬜ Set up custom domain (optional)
5. ⬜ Configure Azure Database (optional)
6. ⬜ Set up monitoring

See `AZURE_DEPLOYMENT_GUIDE.md` for detailed instructions.

---

## 📞 Need Help?

- **Full Guide**: `AZURE_DEPLOYMENT_GUIDE.md`
- **User Guide**: `USER_GUIDE.md`
- **OTP System**: `OTP_FINAL_SUMMARY.md`

---

**You're all set! Happy emailing! 📧✨**

---

**Estimated Time**: 15-20 minutes
**Difficulty**: Easy
**Cost**: Free tier available
