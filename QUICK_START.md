# IMAP Feature - Quick Start Guide

## 🚀 Deploy in 3 Steps

### Step 1: Set Environment Variables
```bash
# In backend/.env
SECRET_KEY=your-strong-secret-key-minimum-32-characters
DATABASE_URL=your-database-url
FRONTEND_URL=https://your-domain.com
```

### Step 2: Run Deployment Script
```bash
chmod +x deploy_imap_feature.sh
./deploy_imap_feature.sh
```

### Step 3: Restart Backend
```bash
# PM2
pm2 restart novamailer-backend

# Or systemd
sudo systemctl restart novamailer

# Or Docker
docker-compose restart backend
```

## ✅ Verify Deployment

### Test Backend
```bash
cd backend
python test_imap_setup.py
```

### Test Frontend
1. Go to Settings page
2. Configure SMTP (if not already done)
3. Configure IMAP (auto-fills from SMTP)
4. Click "Test IMAP"
5. Go to Mail page - should auto-connect

## 📝 User Instructions

### Gmail Setup
1. Go to Settings → IMAP Configuration
2. Host: `imap.gmail.com`
3. Port: `993`
4. Username: Your Gmail address
5. Password: Generate App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
6. Click "Save IMAP Settings"
7. Click "Test IMAP" to verify

### Outlook Setup
1. Go to Settings → IMAP Configuration
2. Host: `outlook.office365.com`
3. Port: `993`
4. Username: Your Outlook email
5. Password: Your Outlook password
6. Click "Save IMAP Settings"
7. Click "Test IMAP" to verify

## 🐛 Troubleshooting

### "Authentication failed"
- For Gmail: Use App Password, not regular password
- Enable 2FA first, then generate App Password
- Remove spaces from password

### "Connection timeout"
- Check firewall allows port 993
- Verify IMAP is enabled in email provider settings
- Try increasing timeout in code

### "No IMAP config saved"
- Save IMAP settings in Settings page first
- Check database has imap_configs table
- Verify user is logged in

## 📚 Full Documentation

- **Deployment**: See `IMAP_DEPLOYMENT_GUIDE.md`
- **Checklist**: See `PRODUCTION_READINESS_CHECKLIST.md`
- **Summary**: See `IMAP_FEATURE_SUMMARY.md`

## 🆘 Need Help?

1. Check logs: `tail -f backend/backend.log`
2. Run test script: `python backend/test_imap_setup.py`
3. Check health endpoint: `GET /api/v1/smtp/health`
4. Review error messages in browser console

## 🎉 Success!

When everything works:
- ✅ Settings page shows "✓ Saved" for IMAP
- ✅ Test IMAP shows green success message
- ✅ Mail page auto-connects without login prompt
- ✅ Can read and send emails
- ✅ No errors in backend logs
