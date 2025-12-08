# NovaMailer - FREE Deployment Guide

## 🚀 Quick Deploy (10 minutes)

### Architecture
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│   Railway   │────▶│  PostgreSQL │
│  (Frontend) │     │  (Backend)  │     │  (Database) │
│    FREE     │     │    FREE     │     │    FREE     │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

## Step 2: Deploy Backend on Railway

1. **Go to** https://railway.app
2. **Sign up** with GitHub
3. **Click** "New Project" → "Deploy from GitHub repo"
4. **Select** your repository
5. **Set Root Directory**: `backend`
6. **Wait** for deployment to start

### Add PostgreSQL Database
1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Done! Railway auto-connects it

### Add Environment Variables
Click on your backend service → **"Variables"** → Add these:

```
SECRET_KEY=change-this-to-a-random-string-32-chars
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000
```

> **Note**: `DATABASE_URL` is auto-set by Railway from PostgreSQL!

### Get Your Backend URL
After deploy, Railway shows URL like:
`https://novamailer-backend-production.up.railway.app`

**Copy this URL!**

---

## Step 3: Deploy Frontend on Vercel

1. **Go to** https://vercel.com
2. **Sign up** with GitHub
3. **Click** "Add New" → "Project"
4. **Import** your repository
5. **Configure**:
   - Root Directory: `frontend`
   - Framework: Next.js (auto-detected)

### Add Environment Variable
In Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://your-railway-backend-url.up.railway.app
```

6. **Click** "Deploy"

---

## Step 4: Update Backend CORS

After getting your Vercel URL (e.g., `https://novamailer.vercel.app`):

1. Go to Railway → Backend service → Variables
2. Update `CORS_ORIGINS`:
```
CORS_ORIGINS=https://novamailer.vercel.app,http://localhost:3000
```
3. Update `FRONTEND_URL`:
```
FRONTEND_URL=https://novamailer.vercel.app
```

---

## ✅ Done!

Your app is now live:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.up.railway.app
- **Database**: PostgreSQL (managed by Railway)

---

## 💰 Cost: $0/month

| Service | Free Tier |
|---------|-----------|
| Vercel | Unlimited for hobby |
| Railway | $5 credit/month (enough for small apps) |
| PostgreSQL | Included with Railway |

---

## 🔧 Troubleshooting

### Backend not starting?
- Check Railway logs (click on service → "Logs")
- Verify all environment variables are set
- Make sure `requirements.txt` is in `backend/` folder

### Frontend can't connect to backend?
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify `CORS_ORIGINS` includes your Vercel domain
- Check Railway backend is running

### Database errors?
- Railway auto-sets `DATABASE_URL`
- Check PostgreSQL service is running
- View logs for connection errors

---

## 📧 Gmail SMTP Setup

To send emails, create a Gmail App Password:

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and your device
3. Generate password
4. Use this as `SMTP_PASSWORD` in Railway

---

## 🔄 Auto-Deploy

Both Vercel and Railway auto-deploy when you push to GitHub!

```bash
git add .
git commit -m "Update feature"
git push
# Both frontend and backend redeploy automatically!
```
