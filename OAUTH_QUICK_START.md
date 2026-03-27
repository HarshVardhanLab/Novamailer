# OAuth Quick Start - 5 Minutes Setup (Desktop App)

## For Desktop App (Local Backend)

### 1. Google OAuth (2 minutes)

```bash
# 1. Go to https://console.cloud.google.com/
# 2. Create project → Enable Gmail API
# 3. OAuth consent screen → External → Add test user (your Gmail)
# 4. Credentials → Create OAuth Client ID → Web application
# 5. Add redirect URI: http://localhost:8000/api/v1/oauth/callback
# 6. Copy Client ID and Secret
```

Add to `backend/.env`:
```env
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
FRONTEND_URL=http://localhost:3000
```

### 2. Microsoft OAuth (2 minutes)

```bash
# 1. Go to https://portal.azure.com/
# 2. Azure AD → App registrations → New registration
# 3. Name: NovaMailer, Accounts: Any, Redirect: http://localhost:8000/api/v1/oauth/callback
# 4. Certificates & secrets → New client secret → Copy value
# 5. API permissions → Add: Mail.ReadWrite, Mail.Send, IMAP.AccessAsUser.All, SMTP.Send, offline_access
# 6. Grant admin consent
```

Add to `backend/.env`:
```env
MICROSOFT_CLIENT_ID=your-app-id
MICROSOFT_CLIENT_SECRET=your-secret
MICROSOFT_TENANT_ID=common
FRONTEND_URL=http://localhost:3000
```

### 3. Run Migration (30 seconds)

```bash
cd backend
python migrate_oauth_columns.py
pm2 restart novamailer-backend
```

### 4. Test (30 seconds)

1. Open desktop app
2. Go to Settings
3. Click "Connect with Google" or "Connect with Microsoft"
4. Browser opens → Sign in and grant permissions
5. Success page appears and auto-closes
6. Done! ✅

---

## Important for Desktop Apps

### Redirect URI
Use backend URL: `http://localhost:8000/api/v1/oauth/callback`

NOT frontend URL: ~~`http://localhost:3000/api/oauth/callback`~~

### How It Works
1. Desktop app opens OAuth URL in system browser
2. User signs in
3. Browser redirects to backend (`localhost:8000`)
4. Backend saves tokens and shows success page
5. Success page auto-closes
6. Desktop app reloads settings

---

## For Production (Distributed Desktop App)

### Update Redirect URIs

**Google:**
- Add: `https://api.your-domain.com/api/v1/oauth/callback`

**Microsoft:**
- Add: `https://api.your-domain.com/api/v1/oauth/callback`

### Update Environment

```env
FRONTEND_URL=https://api.your-domain.com
GOOGLE_CLIENT_ID=your-production-id
GOOGLE_CLIENT_SECRET=your-production-secret
MICROSOFT_CLIENT_ID=your-production-id
MICROSOFT_CLIENT_SECRET=your-production-secret
```

---

## Verify Setup

```bash
# Check OAuth is enabled
curl http://localhost:8000/api/v1/oauth/config

# Should return:
{
  "google": {"enabled": true, "client_id": "..."},
  "microsoft": {"enabled": true, "client_id": "..."}
}
```

---

## Troubleshooting

### "Redirect URI mismatch"
→ Use `http://localhost:8000/api/v1/oauth/callback` (backend URL)
→ No trailing slash
→ Port must be 8000 (or your backend port)

### "OAuth not configured"
→ Check CLIENT_ID and CLIENT_SECRET in backend/.env
→ Restart backend

### "Access denied"
→ For Google: Add yourself as test user
→ For Microsoft: Grant admin consent

---

## Full Documentation

- Desktop App Setup: `OAUTH_DESKTOP_APP_SETUP.md`
- General OAuth Setup: `OAUTH_SETUP_GUIDE.md`

