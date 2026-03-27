# OAuth Setup for Desktop App

## Overview

For desktop applications, OAuth uses `http://localhost` redirect URIs. The backend handles the OAuth callback and displays a success/error page that auto-closes.

## Key Differences from Web Apps

- ✅ Redirect URI: `http://localhost:8000/api/v1/oauth/callback` (backend URL)
- ✅ No frontend domain needed
- ✅ OAuth popup opens in system browser
- ✅ Success page auto-closes after 3 seconds
- ✅ Desktop app receives message via `postMessage`

---

## Google OAuth Setup (Desktop App)

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "NovaMailer Desktop"
3. Enable Gmail API

### 2. Configure OAuth Consent Screen

1. Go to **OAuth consent screen**
2. Choose **External**
3. Fill in:
   - App name: `NovaMailer Desktop`
   - User support email: Your email
   - Developer contact: Your email
4. Add scope: `https://mail.google.com/`
5. Add test users (your Gmail address)

### 3. Create OAuth Credentials

1. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
2. Application type: **Web application** (yes, even for desktop!)
3. Name: `NovaMailer Desktop Client`
4. Add redirect URI: `http://localhost:8000/api/v1/oauth/callback`
5. Copy Client ID and Secret

### 4. Configure Backend

Add to `backend/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
FRONTEND_URL=http://localhost:3000
```

---

## Microsoft OAuth Setup (Desktop App)

### 1. Register Application

1. Go to [Azure Portal](https://portal.azure.com/)
2. **Azure AD** → **App registrations** → **New registration**
3. Name: `NovaMailer Desktop`
4. Supported accounts: **Personal Microsoft accounts only** (or multi-tenant)
5. Redirect URI:
   - Platform: **Web**
   - URI: `http://localhost:8000/api/v1/oauth/callback`
6. Click **Register**

### 2. Create Client Secret

1. Go to **Certificates & secrets**
2. **New client secret**
3. Description: `Desktop App Secret`
4. Copy the secret value immediately

### 3. Configure API Permissions

1. Go to **API permissions**
2. **Add permission** → **Microsoft Graph** → **Delegated**
3. Add:
   - `Mail.ReadWrite`
   - `Mail.Send`
   - `IMAP.AccessAsUser.All`
   - `SMTP.Send`
   - `offline_access`
   - `User.Read`
4. **Grant admin consent** (if admin)

### 4. Configure Backend

Add to `backend/.env`:

```env
MICROSOFT_CLIENT_ID=your-application-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=common
FRONTEND_URL=http://localhost:3000
```

---

## Backend Configuration

### Environment Variables

```env
# Backend URL (where OAuth callback is handled)
FRONTEND_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-app-id
MICROSOFT_CLIENT_SECRET=your-secret
MICROSOFT_TENANT_ID=common
```

### Run Migration

```bash
cd backend
python migrate_oauth_columns.py
```

### Restart Backend

```bash
pm2 restart novamailer-backend
# or
python main.py
```

---

## How It Works

### OAuth Flow for Desktop App

1. User clicks "Connect with Google/Microsoft" in Settings
2. Desktop app opens system browser with OAuth URL
3. User signs in and grants permissions
4. Browser redirects to `http://localhost:8000/api/v1/oauth/callback`
5. Backend exchanges code for tokens
6. Backend saves tokens to database
7. Backend displays success page with auto-close
8. Success page sends message to desktop app via `postMessage`
9. Desktop app receives confirmation and reloads settings

### Redirect URI

```
http://localhost:8000/api/v1/oauth/callback
```

This is the backend URL, not the frontend URL. The backend handles the OAuth callback directly.

---

## Testing

### 1. Start Backend

```bash
cd backend
python main.py
# Backend should be running on http://localhost:8000
```

### 2. Start Desktop App

```bash
npm run electron:dev
# or
npm run electron:start
```

### 3. Test OAuth

1. Open Settings in desktop app
2. Click "Connect with Google"
3. Browser opens with Google sign-in
4. Grant permissions
5. Success page appears and auto-closes
6. Desktop app shows "Connected with Google"
7. Go to Mail page - should auto-connect

---

## Troubleshooting

### "Redirect URI mismatch"

**Problem:** OAuth provider rejects the redirect URI

**Solution:**
- Ensure redirect URI is exactly: `http://localhost:8000/api/v1/oauth/callback`
- No trailing slash
- Use `localhost`, not `127.0.0.1`
- Port must match backend port (8000)

### "OAuth popup blocked"

**Problem:** Browser blocks popup window

**Solution:**
- Allow popups for the desktop app
- Or open OAuth URL in default browser using Electron's `shell.openExternal()`

### "Success page doesn't close"

**Problem:** Success page stays open

**Solution:**
- Page auto-closes after 3 seconds
- User can manually close the window
- Check browser console for errors

### "Desktop app doesn't receive message"

**Problem:** `postMessage` not working

**Solution:**
- Ensure popup is opened with `window.open()`, not external browser
- Check that message listener is set up correctly
- Verify origin in `postMessage` handler

---

## Production Deployment

### For Distributed Desktop Apps

If you're distributing your desktop app to users:

1. **Use a web server for OAuth callback**
   - Deploy backend to a public server
   - Use HTTPS: `https://api.your-domain.com/api/v1/oauth/callback`
   - Update redirect URIs in OAuth consoles

2. **Update OAuth credentials**
   - Create production OAuth credentials
   - Use production redirect URI
   - Update `FRONTEND_URL` in backend config

3. **Publish OAuth apps**
   - Google: Submit for verification
   - Microsoft: Grant admin consent

### Environment Variables for Production

```env
FRONTEND_URL=https://api.your-domain.com
GOOGLE_CLIENT_ID=production-client-id
GOOGLE_CLIENT_SECRET=production-secret
MICROSOFT_CLIENT_ID=production-app-id
MICROSOFT_CLIENT_SECRET=production-secret
```

---

## Security Considerations

### Localhost Security

- `http://localhost` is considered secure by OAuth providers
- Only works for local development/desktop apps
- Cannot be used for web apps in production

### Token Storage

- Tokens are encrypted in database
- Desktop app never sees raw tokens
- Tokens are automatically refreshed

### State Token

- Prevents CSRF attacks
- Single-use only
- Expires after use

---

## FAQ

**Q: Can I use `127.0.0.1` instead of `localhost`?**
A: Some OAuth providers require `localhost` specifically. Use `localhost` for best compatibility.

**Q: What port should I use?**
A: Use your backend port (default: 8000). The redirect URI must match your backend URL.

**Q: Do I need a domain for desktop apps?**
A: No! Desktop apps can use `http://localhost` redirect URIs.

**Q: Can multiple users use the same OAuth credentials?**
A: Yes, the same OAuth credentials work for all users of your desktop app.

**Q: How do I handle OAuth in packaged desktop apps?**
A: Either:
1. Use localhost with local backend
2. Use a web server for OAuth callback (recommended for distribution)

---

## Example: Electron Integration

### Open OAuth in System Browser

```javascript
const { shell } = require('electron')

// When user clicks OAuth button
ipcMain.on('oauth-connect', async (event, provider) => {
  const response = await fetch('http://localhost:8000/api/v1/oauth/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider })
  })
  
  const data = await response.json()
  
  // Open in system browser
  shell.openExternal(data.auth_url)
})
```

### Listen for OAuth Completion

```javascript
// Poll backend for OAuth status
const checkOAuthStatus = setInterval(async () => {
  const response = await fetch('http://localhost:8000/api/v1/smtp')
  const data = await response.json()
  
  if (data.auth_type === 'oauth') {
    clearInterval(checkOAuthStatus)
    // OAuth completed!
    event.reply('oauth-success', data.oauth_provider)
  }
}, 1000)
```

---

## Support

For issues or questions:
- Check backend logs: `tail -f backend/backend.log`
- Test OAuth config: `GET /api/v1/oauth/config`
- Verify redirect URI matches exactly
- Ensure backend is running on correct port
