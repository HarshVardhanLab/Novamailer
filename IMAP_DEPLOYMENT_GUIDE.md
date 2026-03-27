# IMAP Feature Deployment Guide

## Overview
This guide covers deploying the IMAP mail management feature to production.

## Pre-Deployment Checklist

### 1. Database Migration
```bash
# Run the table creation script
cd backend
python create_tables.py

# Verify the imap_configs table was created
# For SQLite:
sqlite3 novamailer.db "SELECT name FROM sqlite_master WHERE type='table' AND name='imap_configs';"

# For PostgreSQL/Supabase:
# Check via Supabase dashboard or psql
```

### 2. Encrypt Existing Passwords (if upgrading)
```bash
# If you have existing SMTP configs, encrypt their passwords
cd backend
python migrate_encrypt_passwords.py
```

### 3. Environment Variables
Ensure these are set in production:

```env
# Required for password encryption
SECRET_KEY=your-strong-secret-key-here  # MUST be set and kept secure

# Database connection
DATABASE_URL=your-production-database-url

# Frontend URL for CORS
FRONTEND_URL=https://your-domain.com
CORS_ORIGINS=https://your-domain.com
```

### 4. Dependencies
Verify all required packages are installed:

```bash
cd backend
pip install -r requirements.txt

# Key packages for IMAP:
# - cryptography (for password encryption)
# - aiosmtplib (for sending emails)
# - asyncpg or aiosqlite (for database)
```

## Security Considerations

### Password Encryption
- SMTP and IMAP passwords are now encrypted at rest using Fernet (symmetric encryption)
- Encryption key is derived from `SECRET_KEY` using PBKDF2
- **CRITICAL**: Never change `SECRET_KEY` after deployment or existing passwords will be unrecoverable

### API Security
- All IMAP endpoints require authentication
- Credentials are never logged
- Passwords are encrypted before storage
- SSL/TLS is enforced for IMAP connections

### Rate Limiting (Recommended)
Consider adding rate limiting to prevent abuse:

```python
# Example using slowapi
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/connect")
@limiter.limit("5/minute")  # 5 connection attempts per minute
async def connect_imap(...):
    ...
```

## Feature Verification

### 1. Test SMTP Configuration
1. Go to Settings page
2. Configure SMTP settings
3. Click "Test Connection"
4. Verify success message

### 2. Test IMAP Configuration
1. In Settings, scroll to IMAP section
2. Enter IMAP credentials
3. Click "Save IMAP Settings"
4. Click "Test IMAP"
5. Verify success message

### 3. Test Mail Auto-Connect
1. Navigate to Mail page
2. Should auto-connect if IMAP config is saved
3. Verify folders load automatically
4. Test reading emails

### 4. Test Mail Operations
- Read emails (marks as read)
- Flag/unflag emails
- Move emails between folders
- Delete emails
- Compose and send replies

## Monitoring

### Logs to Watch
```bash
# Backend logs
tail -f backend/backend.log

# Look for:
# - "Connecting to IMAP server"
# - "Successfully authenticated"
# - Any authentication failures
# - Connection timeouts
```

### Common Issues

#### "Authentication failed"
- Verify credentials are correct
- For Gmail: Use App Password, not regular password
- Check if 2FA is enabled (requires app password)

#### "Connection timeout"
- Check firewall rules
- Verify IMAP port (usually 993 for SSL)
- Test network connectivity to mail server

#### "No IMAP config saved"
- User needs to save IMAP settings in Settings page first
- Check database for imap_configs table

#### Decryption errors
- `SECRET_KEY` was changed after passwords were encrypted
- Run migration script again or have users re-enter passwords

## Rollback Plan

If issues occur:

1. **Disable IMAP feature temporarily**:
   ```python
   # In backend/main.py, comment out:
   # app.include_router(mail.router, ...)
   ```

2. **Revert database changes**:
   ```sql
   -- Drop IMAP table if needed
   DROP TABLE IF EXISTS imap_configs;
   ```

3. **Restore previous version**:
   ```bash
   git revert <commit-hash>
   ```

## Performance Optimization

### Connection Pooling
For high-traffic deployments, consider implementing IMAP connection pooling to reduce connection overhead.

### Caching
- Cache folder lists for 5 minutes
- Cache message lists for 1 minute
- Invalidate cache on user actions (move, delete, etc.)

### Pagination
- Default: 25 messages per page
- Adjust based on performance needs
- Consider lazy loading for large mailboxes

## Production Best Practices

1. **Backup Strategy**
   - Regular database backups
   - Include encrypted passwords in backups
   - Store `SECRET_KEY` securely (not in git)

2. **Monitoring**
   - Set up alerts for authentication failures
   - Monitor IMAP connection timeouts
   - Track API response times

3. **User Communication**
   - Document Gmail App Password setup
   - Provide troubleshooting guide
   - Set expectations for sync delays

4. **Compliance**
   - Ensure GDPR compliance for stored credentials
   - Implement data retention policies
   - Provide user data export/deletion

## Support Resources

### Gmail App Password Setup
1. Go to myaccount.google.com/apppasswords
2. Select "Mail" and your device
3. Generate password
4. Use generated password in IMAP settings

### Common IMAP Ports
- 993: IMAP over SSL (most common)
- 143: IMAP with STARTTLS

### Testing Credentials
```bash
# Test IMAP connection manually
openssl s_client -connect imap.gmail.com:993
# Then: a1 LOGIN username password
```

## Post-Deployment

1. Monitor error logs for 24 hours
2. Verify user feedback
3. Check database growth
4. Review performance metrics
5. Update documentation based on issues

## Success Criteria

- [ ] Database tables created successfully
- [ ] Existing passwords encrypted
- [ ] SMTP test connection works
- [ ] IMAP test connection works
- [ ] Mail page auto-connects
- [ ] Can read emails
- [ ] Can send replies
- [ ] Can move/delete emails
- [ ] No authentication errors in logs
- [ ] Response times < 2 seconds

## Emergency Contacts

- Backend issues: Check backend logs
- Database issues: Check database connection
- Frontend issues: Check browser console
- Email provider issues: Check provider status page
