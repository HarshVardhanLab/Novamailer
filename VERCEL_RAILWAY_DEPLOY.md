# Deploy NovaMailer - Vercel + Railway (FREE)

## Architecture
- **Frontend**: Vercel (Next.js) - FREE
- **Backend**: Railway (FastAPI) - FREE ($5 credit/month)
- **Database**: Railway PostgreSQL - FREE

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub

### 1.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub and select this repo
4. Choose the `backend` folder as root

### 1.3 Add PostgreSQL Database
1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will create a PostgreSQL instance

### 1.4 Configure Environment Variables
In Railway dashboard → Backend service → Variables:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
SECRET_KEY=your-super-secret-key-change-this
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FRONTEND_URL=https://your-app.vercel.app
```

### 1.5 Configure Build Settings
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT`

### 1.6 Get Backend URL
After deployment, Railway gives you a URL like:
`https://novamailer-backend-production.up.railway.app`

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub

### 2.2 Import Project
1. Click "Add New" → "Project"
2. Import your GitHub repo
3. Set Root Directory to `frontend`

### 2.3 Configure Environment Variables
In Vercel dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://your-railway-backend-url.up.railway.app
```

### 2.4 Deploy
Click "Deploy" - Vercel will build and deploy automatically!

---

## Step 3: Update CORS

After getting your Vercel URL, update the backend's CORS settings.

In `backend/app/core/config.py`, ensure your Vercel domain is allowed:
```python
CORS_ORIGINS: str = "https://your-app.vercel.app,http://localhost:3000"
```

Or set it via Railway environment variable:
```
CORS_ORIGINS=https://your-app.vercel.app
```

---

## Quick Deploy Commands

### Railway CLI (optional)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize in backend folder
cd backend
railway init

# Deploy
railway up
```

### Vercel CLI (optional)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel
```

---

## Cost Summary

| Service | Cost |
|---------|------|
| Vercel (Frontend) | FREE |
| Railway (Backend) | FREE ($5 credit/month) |
| Railway PostgreSQL | FREE (included) |
| **Total** | **$0/month** |

---

## Troubleshooting

### Backend not starting
- Check Railway logs
- Ensure `requirements.txt` has all dependencies
- Verify DATABASE_URL is set correctly

### Frontend can't reach backend
- Check NEXT_PUBLIC_API_URL is correct
- Verify CORS is configured for your Vercel domain
- Check Railway backend is running

### Database connection issues
- Use `DATABASE_URL` from Railway (auto-configured)
- Ensure `asyncpg` is in requirements.txt for PostgreSQL
