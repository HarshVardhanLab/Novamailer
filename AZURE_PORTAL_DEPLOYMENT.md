# 🌐 Deploy NovaMailer via Azure Portal (GUI)

Step-by-step guide to deploy NovaMailer using the Azure Portal web interface.

---

## 📋 Prerequisites

- Azure account logged in
- Your `novamailer-rg` resource group in Central India
- Project files ready (backend and frontend folders)

---

## 🚀 Part 1: Deploy Backend

### Step 1: Create Backend Web App

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your resource group: **novamailer-rg**
3. Click **+ Create** → Search for **Web App** → Click **Create**

### Step 2: Configure Backend App

**Basics Tab:**
- **Subscription**: Azure for Students Starter
- **Resource Group**: novamailer-rg
- **Name**: `novamailer-backend` (must be globally unique)
- **Publish**: Code
- **Runtime stack**: Python 3.11
- **Operating System**: Linux
- **Region**: Central India
- **App Service Plan**: Select existing `novamailer-plan` (or create new F1 Free)

Click **Review + Create** → **Create**

### Step 3: Configure Backend Settings

1. Once created, go to the app: **novamailer-backend**
2. In left menu, go to **Configuration**
3. Click **+ New application setting** and add these:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `sqlite:///./data/novamailer.db` |
| `SECRET_KEY` | Generate with: `openssl rand -hex 32` |
| `CORS_ORIGINS` | `https://novamailer-frontend.azurewebsites.net` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` |

4. Click **Save** → **Continue**

### Step 4: Deploy Backend Code

**Option A: Using ZIP Deploy (Recommended)**

1. On your computer, create a ZIP file:
   ```bash
   cd backend
   zip -r backend.zip . -x "venv/*" -x "__pycache__/*" -x "*.pyc"
   ```

2. In Azure Portal, go to **novamailer-backend**
3. In left menu, go to **Deployment Center**
4. Click **FTPS credentials** tab
5. Note the **FTPS endpoint** and credentials
6. Or use **Local Git** or **GitHub** for deployment

**Option B: Using Azure CLI (Easier)**

```bash
cd backend
zip -r backend.zip . -x "venv/*" -x "__pycache__/*" -x "*.pyc"
az webapp deployment source config-zip \
  --name novamailer-backend \
  --resource-group novamailer-rg \
  --src backend.zip
```

### Step 5: Add Startup Command

1. Go to **novamailer-backend** → **Configuration**
2. Click **General settings** tab
3. In **Startup Command**, enter:
   ```
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
   ```
4. Click **Save**

### Step 6: Verify Backend

1. Go to **Overview** tab
2. Click on the **URL** (e.g., `https://novamailer-backend.azurewebsites.net`)
3. Add `/health` to URL: `https://novamailer-backend.azurewebsites.net/health`
4. Should see: `{"status":"ok"}`

---

## 🎨 Part 2: Deploy Frontend

### Step 1: Create Frontend Web App

1. In **novamailer-rg**, click **+ Create**
2. Search for **Web App** → Click **Create**

### Step 2: Configure Frontend App

**Basics Tab:**
- **Subscription**: Azure for Students Starter
- **Resource Group**: novamailer-rg
- **Name**: `novamailer-frontend` (must be globally unique)
- **Publish**: Code
- **Runtime stack**: Node 18 LTS
- **Operating System**: Linux
- **Region**: Central India
- **App Service Plan**: Select existing `novamailer-plan`

Click **Review + Create** → **Create**

### Step 3: Configure Frontend Settings

1. Go to **novamailer-frontend** → **Configuration**
2. Add these application settings:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://novamailer-backend.azurewebsites.net` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` |

3. Click **Save** → **Continue**

### Step 4: Deploy Frontend Code

**Option A: Using ZIP Deploy**

1. Create ZIP file:
   ```bash
   cd frontend
   zip -r frontend.zip . -x "node_modules/*" -x ".next/*" -x ".git/*"
   ```

2. Deploy via Azure CLI:
   ```bash
   az webapp deployment source config-zip \
     --name novamailer-frontend \
     --resource-group novamailer-rg \
     --src frontend.zip
   ```

**Option B: Using GitHub**

1. Push your code to GitHub
2. In Azure Portal, go to **novamailer-frontend**
3. Go to **Deployment Center**
4. Select **GitHub** → Authorize → Select repository
5. Select branch → **Save**

### Step 5: Add Startup Command

1. Go to **novamailer-frontend** → **Configuration**
2. Click **General settings** tab
3. In **Startup Command**, enter:
   ```
   npm install && npm run build && npm start
   ```
4. Click **Save**

### Step 6: Verify Frontend

1. Go to **Overview** tab
2. Click on the **URL** (e.g., `https://novamailer-frontend.azurewebsites.net`)
3. Should see your NovaMailer application!

---

## 🔧 Part 3: Update Backend CORS

Now that you have the frontend URL, update backend CORS:

1. Go to **novamailer-backend** → **Configuration**
2. Find `CORS_ORIGINS` setting
3. Update value to your actual frontend URL:
   ```
   https://novamailer-frontend.azurewebsites.net
   ```
4. Click **Save**
5. Go to **Overview** → Click **Restart**

---

## 📊 Monitor Your Apps

### View Logs

1. Go to your web app
2. In left menu, go to **Log stream**
3. See real-time logs

### Check Metrics

1. Go to **Monitoring** → **Metrics**
2. View requests, response times, errors

---

## 🐛 Troubleshooting

### Backend Issues

1. **Check Logs**:
   - Go to **novamailer-backend** → **Log stream**
   - Look for errors

2. **Check Configuration**:
   - Go to **Configuration** → Verify all settings
   - Make sure `SCM_DO_BUILD_DURING_DEPLOYMENT` is `true`

3. **Restart App**:
   - Go to **Overview** → Click **Restart**

### Frontend Issues

1. **Build Errors**:
   - Check **Deployment Center** → **Logs**
   - Look for npm install or build errors

2. **API Connection**:
   - Verify `NEXT_PUBLIC_API_URL` is correct
   - Check browser console for CORS errors

---

## 💡 Tips

### Make Apps Always On (Requires Basic Tier)

Free tier apps sleep after 20 minutes. To keep them awake:

1. Upgrade to Basic tier:
   - Go to **App Service Plan** → **Scale up**
   - Select **B1 Basic** (~$13/month)

2. Enable Always On:
   - Go to each web app → **Configuration** → **General settings**
   - Turn on **Always On**

### Add Custom Domain

1. Go to web app → **Custom domains**
2. Click **Add custom domain**
3. Follow instructions to verify domain
4. Add SSL certificate (free with App Service)

---

## ✅ Deployment Checklist

### Backend
- [ ] Web app created
- [ ] Configuration settings added
- [ ] Code deployed
- [ ] Startup command set
- [ ] Health endpoint working

### Frontend
- [ ] Web app created
- [ ] Configuration settings added
- [ ] Code deployed
- [ ] Startup command set
- [ ] Application loads

### Final Steps
- [ ] Backend CORS updated with frontend URL
- [ ] Both apps restarted
- [ ] Register admin account
- [ ] Configure SMTP
- [ ] Test email sending

---

## 🎉 Success!

Once both apps are deployed:

1. **Frontend URL**: `https://novamailer-frontend.azurewebsites.net`
2. **Backend URL**: `https://novamailer-backend.azurewebsites.net`

Visit the frontend URL and start using NovaMailer!

---

## 📝 Quick Commands for ZIP Deployment

```bash
# Backend
cd backend
zip -r backend.zip . -x "venv/*" -x "__pycache__/*" -x "*.pyc"
az webapp deployment source config-zip \
  --name novamailer-backend \
  --resource-group novamailer-rg \
  --src backend.zip

# Frontend
cd frontend
zip -r frontend.zip . -x "node_modules/*" -x ".next/*" -x ".git/*"
az webapp deployment source config-zip \
  --name novamailer-frontend \
  --resource-group novamailer-rg \
  --src frontend.zip
```

---

**Estimated Time**: 20-30 minutes (manual deployment)

**Difficulty**: Easy (point and click)

**Cost**: FREE (with Azure for Students Starter)

---

**Last Updated**: December 2024
