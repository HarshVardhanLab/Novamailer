# NovaMailer - Vercel + Supabase Deployment Guide

Complete step-by-step guide to deploy NovaMailer for FREE.

---

## Prerequisites

- GitHub account
- Node.js installed (for Vercel CLI)
- Your NovaMailer project code

---

## Step 1: Create Supabase Database (FREE)

### 1.1 Sign Up
1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with **GitHub** (recommended)

### 1.2 Create New Project
1. Click **"New Project"**
2. Select your organization
3. Fill in:
   - **Project name**: `novamailer` (or any name)
   - **Database Password**: Create a strong password → **SAVE THIS PASSWORD!**
   - **Region**: Select closest to your users
4. Click **"Create new project"**
5. Wait 2-3 minutes for setup

### 1.3 Get Database Connection String
1. In your project, click **"Connect"** button (top right, next to "main")
2. Or go to: **Project Settings** (gear icon) → **Database**
3. Scroll to **"Connection string"** section
4. Click **"URI"** tab
5. Copy the connection string:
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
6. **Replace `[YOUR-PASSWORD]`** with the password you created in step 1.2

**Save this connection string - you'll need it later!**

---

## Step 2: Install Vercel CLI

Open terminal and run:

```bash
npm install -g vercel
```

Then login:

```bash
vercel login
```

Follow the prompts to authenticate with your email or GitHub.

---

## Step 3: Deploy Backend

### 3.1 Navigate to Backend
```bash
cd backend
```

### 3.2 Deploy
```bash
vercel
```

Answer the prompts:
- **Set up and deploy?** → `Y`
- **Which scope?** → Select your account
- **Link to existing project?** → `N`
- **Project name?** → `novamailer-backend` (or any name)
- **Directory?** → `./` (press Enter)
- **Override settings?** → `N`

### 3.3 Note Your Backend URL
After deployment, you'll see:
```
✅ Production: https://novamailer-backend-xxxxx.vercel.app
```
**Copy this URL!**

### 3.4 Set Backend Environment Variables
1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your **backend project**
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Supabase connection string from Step 1.3 |
| `SECRET_KEY` | `your-super-secret-key-at-least-32-characters-long` |
| `CORS_ORIGINS` | `http://localhost:3000` (update after frontend deploy) |
| `FRONTEND_URL` | `http://localhost:3000` (update after frontend deploy) |

5. Click **Save**

### 3.5 Redeploy Backend
```bash
vercel --prod
```

### 3.6 Test Backend
Visit: `https://your-backend-url.vercel.app/api/health`

Should return:
```json
{"status": "ok"}
```

---

## Step 4: Deploy Frontend

### 4.1 Navigate to Frontend
```bash
cd ../frontend
```

### 4.2 Deploy
```bash
vercel
```

Answer the prompts:
- **Set up and deploy?** → `Y`
- **Which scope?** → Select your account
- **Link to existing project?** → `N`
- **Project name?** → `novamailer-frontend` (or any name)
- **Directory?** → `./`
- **Override settings?** → `N`

### 4.3 Note Your Frontend URL
```
✅ Production: https://novamailer-frontend-xxxxx.vercel.app
```
**Copy this URL!**

### 4.4 Set Frontend Environment Variables
1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your **frontend project**
3. Go to **Settings** → **Environment Variables**
4. Add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend-url.vercel.app` (from Step 3.3) |

5. Click **Save**

### 4.5 Redeploy Frontend
```bash
vercel --prod
```

---

## Step 5: Update Backend CORS

Now that you have your frontend URL, update the backend:

1. Go to Vercel Dashboard → **Backend project** → **Settings** → **Environment Variables**
2. Update these variables:

| Name | New Value |
|------|-----------|
| `CORS_ORIGINS` | `https://your-frontend-url.vercel.app` |
| `FRONTEND_URL` | `https://your-frontend-url.vercel.app` |

3. Click **Save**
4. Redeploy backend:
```bash
cd ../backend
vercel --prod
```

---

## Step 6: Test Your Deployment

1. Visit your frontend URL: `https://your-frontend-url.vercel.app`
2. Try to register a new account
3. Login and test the features

---

## Troubleshooting

### "Internal Server Error" on Backend
- Check Environment Variables are set correctly
- Check DATABASE_URL has the correct password
- View logs: Vercel Dashboard → Project → **Deployments** → Click latest → **Functions** → View logs

### "Network Error" on Frontend
- Check `NEXT_PUBLIC_API_URL` is correct
- Make sure it doesn't have trailing slash
- Check CORS_ORIGINS includes your frontend URL

### Database Connection Failed
- Verify Supabase project is active (not paused)
- Check DATABASE_URL format is correct
- Make sure password doesn't have special characters that need encoding

### Cold Start Delays
- First request after inactivity may take 5-10 seconds
- This is normal for serverless free tier

---

## Summary of URLs

After deployment, you'll have:

| Service | URL |
|---------|-----|
| Frontend | `https://novamailer-frontend-xxxxx.vercel.app` |
| Backend API | `https://novamailer-backend-xxxxx.vercel.app/api` |
| Health Check | `https://novamailer-backend-xxxxx.vercel.app/api/health` |
| Supabase Dashboard | `https://supabase.com/dashboard` |

---

## Environment Variables Reference

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
SECRET_KEY=your-super-secret-key-at-least-32-characters-long
CORS_ORIGINS=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

---

## Quick Commands Reference

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy backend
cd backend
vercel --prod

# Deploy frontend
cd frontend
vercel --prod

# View deployment logs
vercel logs [deployment-url]
```

---

## Cost: FREE! 🎉

- **Supabase**: Free tier (500MB database)
- **Vercel**: Free tier (100GB bandwidth/month)

---

**Congratulations! Your NovaMailer is now live!** 🚀
