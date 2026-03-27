# OAuth Setup Guide - One-Click Email Authentication

## Overview

OAuth authentication provides a more secure alternative to app passwords. Users can connect their Gmail or Microsoft email accounts with a single click, automatically configuring both SMTP and IMAP.

## Benefits

- ✅ More secure than app passwords
- ✅ One-click setup for both SMTP and IMAP
- ✅ Automatic token refresh
- ✅ No password storage
- ✅ Revocable access
- ✅ Better user experience

## Prerequisites

- Backend server with HTTPS (required for production OAuth)
- Google Cloud Console account (for Gmail)
- Azure Portal account (for Microsoft/Outlook)

---

## Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Name it "NovaMailer" or similar

### Step 2: Enable Gmail API

1. Go to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (unless you have Google Workspace)
3. Fill in required fields:
   - App name: `NovaMailer`
   - User support email: Your email
   - Developer contact: Your email
4. Click **Save and Continue**
5. Add scopes:
   - Click **Add or Remove Scopes**
   - Search and add: `https://mail.google.com/`
   - Click **Update** → **Save and Continue**
6. Add test users (for testing phase):
   - Add your Gmail address
   - Click **Save and Continue**

### Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `NovaMailer Web Client`
5. Add **Authorized redirect URIs**:
   - For Desktop App: `http://localhost:8000/api/v1/oauth/callback`
   - For Web (if needed): `https://your-domain.com/api/oauth/callback`
6. Click **Create**
7. Copy **Client ID** and **Client Secret**

**Note for Desktop Apps:** Use `http://localhost:8000/api/v1/oauth/callback` (backend URL) as the redirect URI.

### Step 5: Configure Backend

Add to `backend/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Step 6: Publish App (Optional - for production)

1. Go to **OAuth consent screen**
2. Click **Publish App**
3. Submit for verification (required for >100 users)

---

## Microsoft OAuth Setup

### Step 1: Register Application

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Fill in:
   - Name: `NovaMailer`
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: 
     - Platform: **Web**
     - URI: `http://localhost:3000/api/oauth/callback` (add production URL later)
5. Click **Register**

### Step 2: Add Redirect URIs

1. Go to **Authentication**
2. Under **Web** → **Redirect URIs**, add:
   - For Desktop App: `http://localhost:8000/api/v1/oauth/callback`
   - For Web (if needed): `https://your-domain.com/api/oauth/callback`
3. Click **Save**

**Note for Desktop Apps:** Use `http://localhost:8000/api/v1/oauth/callback` (backend URL) as the redirect URI.

### Step 3: Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Description: `NovaMailer Secret`
4. Expires: Choose duration (24 months recommended)
5. Click **Add**
6. **Copy the secret value immediately** (you won't see it again)

### Step 4: Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Add these permissions:
   - `Mail.ReadWrite` - Read and write access to user mail
   - `Mail.Send` - Send mail as user
   - `IMAP.AccessAsUser.All` - IMAP access
   - `SMTP.Send` - SMTP send access
   - `offline_access` - Maintain access to data
   - `User.Read` - Sign in and read user profile
6. Click **Add permissions**
7. Click **Grant admin consent** (if you're admin)

### Step 5: Configure Backend

Add to `backend/.env`:

```env
MICROSOFT_CLIENT_ID=your-application-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=common
```

**Note:** Use `common` for multi-tenant (personal + work accounts), or your specific tenant ID for single-tenant.

---

## Backend Configuration

### 1. Update Environment Variables

```bash
cd backend
cp .env.example .env
# Edit .env and add OAuth credentials
```

### 2. Run Database Migration

```bash
cd backend
python migrate_oauth_columns.py
```

### 3. Restart Backend

```bash
# PM2
pm2 restart novamailer-backend

# Or systemd
sudo systemctl restart novamailer

# Or Docker
docker-compose restart backend
```

### 4. Verify Configuration

```bash
# Check OAuth config endpoint
curl http://localhost:8000/api/v1/oauth/config

# Should return:
# {
#   "google": {"enabled": true, "client_id": "..."},
#   "microsoft": {"enabled": true, "client_id": "..."}
# }
```

---

## Frontend Configuration

No configuration needed! The frontend automatically detects available OAuth providers from the backend.

---

## Testing OAuth Flow

### Test Google OAuth

1. Go to Settings page
2. Click **Connect with Google**
3. Sign in with your Google account
4. Grant permissions
5. You'll be redirected back to Settings
6. Verify "Connected with Google" message
7. Go to Mail page - should auto-connect

### Test Microsoft OAuth

1. Go to Settings page
2. Click **Connect with Microsoft**
3. Sign in with your Microsoft account
4. Grant permissions
5. You'll be redirected back to Settings
6. Verify "Connected with Microsoft" message
7. Go to Mail page - should auto-connect

---

## Security Considerations

### Token Storage

- Access tokens are encrypted at rest using Fernet
- Refresh tokens are encrypted at rest
- Tokens are never logged
- Tokens are automatically refreshed when expired

### Redirect URI Security

- Always use HTTPS in production
- Whitelist only your domain
- Never use wildcards in redirect URIs

### Scope Minimization

- Only request necessary scopes
- Gmail: `https://mail.google.com/` (full mail access)
- Microsoft: Specific scopes for IMAP, SMTP, and Mail

### Token Expiration

- Access tokens expire after 1 hour
- Refresh tokens are long-lived
- Automatic refresh before expiration
- Users must re-authenticate if refresh token expires

---

## Troubleshooting

### "OAuth not configured" Error

**Cause:** Missing OAuth credentials in backend

**Solution:**
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`
2. Restart backend server
3. Check `/api/v1/oauth/config` endpoint

### "Redirect URI mismatch" Error

**Cause:** Redirect URI not whitelisted

**Solution:**
1. Add `http://localhost:3000/api/oauth/callback` to authorized redirect URIs
2. For production, add `https://your-domain.com/api/oauth/callback`
3. Ensure exact match (no trailing slash)

### "Access denied" Error

**Cause:** User denied permissions or app not verified

**Solution:**
1. Ensure user grants all requested permissions
2. For Google: Add user as test user during development
3. For Microsoft: Grant admin consent for permissions

### "Token expired" Error

**Cause:** Refresh token expired or revoked

**Solution:**
1. User must disconnect and reconnect OAuth
2. Check token expiration in database
3. Verify refresh token is being saved

### "Invalid grant" Error

**Cause:** Authorization code already used or expired

**Solution:**
1. Don't refresh the callback page
2. Code is single-use only
3. Start OAuth flow again

---

## Production Checklist

### Google OAuth

- [ ] App published (for >100 users)
- [ ] OAuth consent screen verified
- [ ] Production redirect URI added
- [ ] HTTPS enabled
- [ ] Client ID and secret in production env
- [ ] Test with real users

### Microsoft OAuth

- [ ] Admin consent granted
- [ ] Production redirect URI added
- [ ] HTTPS enabled
- [ ] Client ID and secret in production env
- [ ] Secret expiration monitored
- [ ] Test with real users

### Backend

- [ ] OAuth credentials in production `.env`
- [ ] Database migration completed
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Logs monitored for OAuth errors

### Frontend

- [ ] Production redirect URI matches backend
- [ ] HTTPS enabled
- [ ] OAuth buttons visible in Settings
- [ ] Error handling tested

---

## Monitoring

### Metrics to Track

- OAuth connection success rate
- Token refresh success rate
- OAuth errors by type
- User adoption rate

### Logs to Watch

```bash
# OAuth initialization
grep "OAuth" backend/backend.log

# Token refresh
grep "Refreshing.*access token" backend/backend.log

# OAuth errors
grep "OAuth.*error" backend/backend.log
```

---

## User Documentation

### For Gmail Users

1. Go to Settings
2. Click "Connect with Google"
3. Sign in with your Gmail account
4. Click "Allow" to grant permissions
5. Done! Both SMTP and IMAP are configured

### For Outlook/Microsoft Users

1. Go to Settings
2. Click "Connect with Microsoft"
3. Sign in with your Microsoft account
4. Click "Accept" to grant permissions
5. Done! Both SMTP and IMAP are configured

### Disconnecting OAuth

1. Go to Settings
2. Click "Disconnect OAuth"
3. You can now use password authentication

---

## FAQ

**Q: Is OAuth more secure than app passwords?**
A: Yes! OAuth tokens are scoped, revocable, and don't expose your actual password.

**Q: Do I need to set up both Google and Microsoft?**
A: No, set up only the providers your users need.

**Q: Can users switch between OAuth and password auth?**
A: Yes, users can disconnect OAuth and use password authentication.

**Q: What happens when tokens expire?**
A: Access tokens are automatically refreshed. If refresh fails, users must reconnect.

**Q: Can I use OAuth in development?**
A: Yes, use `http://localhost:3000` redirect URI and add test users.

**Q: How do I revoke access?**
A: Users can revoke access from their Google/Microsoft account settings.

---

## Support Resources

### Google OAuth

- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [OAuth Playground](https://developers.google.com/oauthplayground/)

### Microsoft OAuth

- [OAuth 2.0 Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/overview)
- [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)

### NovaMailer

- Backend logs: `tail -f backend/backend.log`
- OAuth config: `GET /api/v1/oauth/config`
- Health check: `GET /api/v1/smtp/health`
