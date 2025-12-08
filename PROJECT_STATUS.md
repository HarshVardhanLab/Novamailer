# NovaMailer - Project Running Successfully! 🚀

## ✅ Current Status

Both servers are **UP and RUNNING**:

- **Frontend**: http://localhost:3000 ✅
- **Backend API**: http://localhost:8000 ✅
- **API Docs**: http://localhost:8000/docs ✅

## 📊 Server Details

### Frontend Server
- **Framework**: Next.js 16.0.5 (Turbopack)
- **Port**: 3000
- **Status**: Running in development mode
- **URL**: http://localhost:3000

### Backend Server
- **Framework**: FastAPI
- **Port**: 8000
- **Status**: Running with auto-reload
- **Database**: SQLite (novamailer.db)
- **API Documentation**: http://localhost:8000/docs

## 🎯 Quick Start Guide

1. **Open the Application**
   - Visit: http://localhost:3000

2. **Register an Account**
   - Click "Register" or go to http://localhost:3000/register
   - Fill in your details and create an account

3. **Login**
   - Use your credentials to login

4. **Configure SMTP (Required for sending emails)**
   - Go to Settings
   - Add your SMTP credentials:
     - For Gmail: Use App Password (not regular password)
     - Host: smtp.gmail.com
     - Port: 587

5. **Create a Template**
   - Go to Templates → New Template
   - Create an HTML email with variables like `{{name}}`, `{{email}}`

6. **Create and Send Campaign**
   - Go to Campaigns → New Campaign
   - Fill in campaign details
   - Upload CSV with recipient data (must have `email` column)
   - Send your campaign!

## 📝 Important Notes

### Database
- Using **SQLite** for local development (easier setup, no PostgreSQL required)
- Database file: `backend/novamailer.db`
- Tables are auto-created on first run

### CSV Format
Your CSV file must have an `email` column. Example:
```csv
email,name,company
john@example.com,John Doe,Acme Corp
jane@example.com,Jane Smith,Tech Inc
```

### SMTP Configuration
For Gmail:
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the app password in Settings

## 🛑 Stopping the Servers

To stop the servers, press `Ctrl+C` in the terminals where they are running.

## 📚 Documentation

- **Full Setup Guide**: See `RUN_PROJECT.md`
- **Error Fixes**: See `ERROR_FIXES.md`
- **Walkthrough**: See artifact `walkthrough.md`

## 🎉 You're All Set!

The application is ready to use. Start by registering an account and exploring the features!
