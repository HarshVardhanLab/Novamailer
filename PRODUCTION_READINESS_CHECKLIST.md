# Production Readiness Checklist - IMAP Feature

## ✅ Completed Items

### Backend Implementation
- [x] IMAPConfig model with encrypted password storage
- [x] SMTPConfig model updated with encrypted password storage
- [x] IMAP service with connection retry logic
- [x] Mail router with comprehensive error handling
- [x] SMTP router with IMAP endpoints (save/load/test/creds)
- [x] Password encryption using Fernet (symmetric encryption)
- [x] Input validation and sanitization
- [x] Logging for debugging and monitoring
- [x] Health check endpoint
- [x] Timeout handling (30s default)
- [x] Connection retry with exponential backoff

### Frontend Implementation
- [x] Settings page with IMAP configuration section
- [x] IMAP save/test functionality
- [x] Auto-fill IMAP from SMTP preset
- [x] useMailSession hook with DB-first loading
- [x] Mail page auto-connect on saved config
- [x] Input validation with Zod schema
- [x] Error handling and user feedback
- [x] Loading states and status indicators

### Database
- [x] imap_configs table schema
- [x] Migration script (migrate_and_restart.sh)
- [x] Password column size increased to 512
- [x] Unique constraint on user_id
- [x] Foreign key relationship with users table

### Security
- [x] Password encryption at rest
- [x] Encrypted passwords in database
- [x] SSL/TLS for IMAP connections
- [x] Authentication required for all endpoints
- [x] No password logging
- [x] Secure password transmission

### Documentation
- [x] IMAP Deployment Guide
- [x] Production Readiness Checklist
- [x] Migration scripts with instructions
- [x] Deployment script (deploy_imap_feature.sh)

## 🔄 Pre-Deployment Tasks

### Environment Setup
- [ ] Set `SECRET_KEY` in production environment
  - Must be strong and unique
  - Never change after deployment
  - Store securely (not in git)
- [ ] Set `DATABASE_URL` for production database
- [ ] Set `FRONTEND_URL` for CORS
- [ ] Verify all environment variables are set

### Database Migration
- [ ] Backup production database
- [ ] Run `python create_tables.py` to create imap_configs table
- [ ] Run `python migrate_password_columns.py` to update column sizes
- [ ] Run `python migrate_encrypt_passwords.py` to encrypt existing passwords
- [ ] Verify tables created successfully
- [ ] Test database connection

### Dependency Installation
- [ ] Install `cryptography` package
- [ ] Verify all requirements.txt packages installed
- [ ] Test imports in Python shell

### Testing
- [ ] Test SMTP configuration save/load
- [ ] Test SMTP connection test
- [ ] Test IMAP configuration save/load
- [ ] Test IMAP connection test
- [ ] Test Mail page auto-connect
- [ ] Test reading emails
- [ ] Test sending replies
- [ ] Test moving/deleting emails
- [ ] Test with Gmail (App Password)
- [ ] Test with Outlook
- [ ] Test error handling (wrong credentials)
- [ ] Test timeout handling

## 🚀 Deployment Steps

### 1. Pre-Deployment
```bash
# Backup database
cp backend/novamailer.db backend/novamailer.db.backup

# Or for PostgreSQL/Supabase
pg_dump $DATABASE_URL > backup.sql
```

### 2. Deploy Code
```bash
# Pull latest code
git pull origin main

# Install dependencies
cd backend
pip install -r requirements.txt
```

### 3. Run Migrations
```bash
# Option A: Use deployment script (recommended)
./deploy_imap_feature.sh

# Option B: Manual steps
cd backend
python create_tables.py
python migrate_password_columns.py
python migrate_encrypt_passwords.py
```

### 4. Restart Services
```bash
# PM2
pm2 restart novamailer-backend

# Or systemd
sudo systemctl restart novamailer

# Or Docker
docker-compose restart backend
```

### 5. Verify Deployment
```bash
# Check logs
tail -f backend/backend.log

# Test health endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://your-domain.com/api/v1/smtp/health
```

## 📊 Monitoring

### Metrics to Track
- [ ] IMAP connection success rate
- [ ] IMAP connection latency
- [ ] Authentication failure rate
- [ ] API response times
- [ ] Error rates by endpoint
- [ ] Database query performance

### Alerts to Set Up
- [ ] High authentication failure rate (> 10%)
- [ ] High connection timeout rate (> 5%)
- [ ] API response time > 5s
- [ ] Database connection errors
- [ ] Disk space low (for SQLite)

### Log Monitoring
```bash
# Watch for errors
tail -f backend/backend.log | grep ERROR

# Watch for IMAP connections
tail -f backend/backend.log | grep "IMAP"

# Watch for authentication failures
tail -f backend/backend.log | grep "Authentication failed"
```

## 🔒 Security Checklist

- [ ] `SECRET_KEY` is strong (32+ characters)
- [ ] `SECRET_KEY` is not in git
- [ ] `SECRET_KEY` is backed up securely
- [ ] Database backups include encrypted passwords
- [ ] SSL/TLS enabled for IMAP connections
- [ ] HTTPS enabled for API endpoints
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (recommended)
- [ ] Authentication required for all endpoints
- [ ] No sensitive data in logs

## 🐛 Common Issues & Solutions

### Issue: "Authentication failed"
**Solution:**
- Verify credentials are correct
- For Gmail: Use App Password
- Check if 2FA is enabled
- Test credentials manually with openssl

### Issue: "Connection timeout"
**Solution:**
- Check firewall rules
- Verify IMAP port (993 for SSL)
- Test network connectivity
- Increase timeout value

### Issue: "No IMAP config saved"
**Solution:**
- User needs to save IMAP settings first
- Check database for imap_configs table
- Verify user_id foreign key

### Issue: Decryption errors
**Solution:**
- `SECRET_KEY` was changed
- Run migration script again
- Have users re-enter passwords

### Issue: "Table already exists"
**Solution:**
- Normal if re-running migrations
- Verify table structure is correct
- Check for any schema differences

## 📈 Performance Optimization

### Recommended Settings
- Connection timeout: 30s (default)
- Max retries: 3 (default)
- Messages per page: 25 (default)
- Cache folder list: 5 minutes
- Cache message list: 1 minute

### For High Traffic
- Implement connection pooling
- Add Redis caching layer
- Use background jobs for email sync
- Implement rate limiting

## 🔄 Rollback Plan

If critical issues occur:

### 1. Quick Rollback
```bash
# Revert code
git revert HEAD
git push

# Restart services
pm2 restart novamailer-backend
```

### 2. Database Rollback
```bash
# Restore backup
cp backend/novamailer.db.backup backend/novamailer.db

# Or for PostgreSQL
psql $DATABASE_URL < backup.sql
```

### 3. Disable Feature
```python
# In backend/main.py, comment out:
# app.include_router(mail.router, prefix=f"{settings.API_V1_STR}/mail", tags=["mail"])
```

## ✅ Post-Deployment Verification

### Immediate (0-1 hour)
- [ ] Backend starts without errors
- [ ] Database migrations completed
- [ ] Health check endpoint returns 200
- [ ] Settings page loads
- [ ] Can save SMTP config
- [ ] Can save IMAP config

### Short-term (1-24 hours)
- [ ] Users can connect to mail
- [ ] Emails load correctly
- [ ] Can send replies
- [ ] No authentication errors in logs
- [ ] Response times acceptable
- [ ] No memory leaks

### Long-term (1-7 days)
- [ ] No user complaints
- [ ] Error rate < 1%
- [ ] Performance stable
- [ ] Database size reasonable
- [ ] Logs clean

## 📞 Support Resources

### Documentation
- IMAP_DEPLOYMENT_GUIDE.md - Detailed deployment guide
- README.md - General project documentation
- API documentation - /docs endpoint

### Testing Tools
```bash
# Test IMAP connection manually
openssl s_client -connect imap.gmail.com:993

# Test API endpoint
curl -X POST https://your-domain.com/api/v1/smtp/imap/test \
  -H "Authorization: Bearer $TOKEN"
```

### Gmail App Password
1. Go to myaccount.google.com/apppasswords
2. Select "Mail" and your device
3. Generate password
4. Use in IMAP settings

## 🎯 Success Criteria

The deployment is successful when:
- ✅ All tests pass
- ✅ No errors in logs
- ✅ Users can save IMAP config
- ✅ Mail page auto-connects
- ✅ Can read and send emails
- ✅ Response times < 2s
- ✅ No authentication failures
- ✅ Database migrations complete
- ✅ Monitoring alerts configured
- ✅ Documentation updated

## 📝 Notes

- Keep `SECRET_KEY` secure and backed up
- Monitor logs for first 24 hours
- Have rollback plan ready
- Communicate with users about new feature
- Document any issues encountered
- Update this checklist based on experience
