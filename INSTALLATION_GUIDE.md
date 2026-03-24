# NovaMailer Desktop - Intel Mac Installation Guide

## 📦 What's Included

Your **NovaMailer-Intel-Standalone.dmg** (209MB) contains:

✅ **Python FastAPI Backend** - Fully bundled with all dependencies
✅ **Next.js Frontend** - Production build with standalone server
✅ **SQLite Database** - Local data storage (created on first run)
✅ **All Dependencies** - No need to install Python, Node.js, or anything else
✅ **SMTP Email Support** - Configure Gmail, Outlook, or any SMTP server

## 🚀 Installation Steps

### 1. Open the DMG
Double-click `NovaMailer-Intel-Standalone.dmg` on your Desktop

### 2. Install the App
Drag **NovaMailer** to your **Applications** folder

### 3. First Launch (Important!)
Since the app isn't signed with an Apple Developer certificate:

1. Open **Applications** folder
2. **Right-click** (or Control+click) on **NovaMailer**
3. Select **"Open"** from the menu
4. Click **"Open"** in the security dialog
5. The app will launch (this step is only needed once)

### 4. Wait for Startup
The first launch takes 30-60 seconds because:
- Python virtual environment is created
- All Python dependencies are installed
- Backend server starts on port 8000
- Frontend server starts on port 3000
- Database is initialized

You'll see the NovaMailer window open automatically when ready.

## 👤 First Time Setup

### Create Your Account
1. Click **"Register"** on the login screen
2. Enter your email and password
3. Click **"Create Account"**
4. You'll be logged in automatically

### Configure SMTP (To Send Emails)
1. Go to **Settings** → **SMTP Configuration**
2. Enter your SMTP details:

**For Gmail:**
- Host: `smtp.gmail.com`
- Port: `587`
- Username: Your Gmail address
- Password: Your Gmail App Password (not regular password)
- From Email: Your Gmail address
- From Name: Your name

**For Outlook:**
- Host: `smtp-mail.outlook.com`
- Port: `587`
- Username: Your Outlook email
- Password: Your Outlook password
- From Email: Your Outlook email
- From Name: Your name

## 📧 Using NovaMailer

### Create a Campaign
1. Go to **Campaigns** → **New Campaign**
2. Enter campaign name and subject
3. Select or create a template
4. Upload a CSV file with recipients (columns: email, name, etc.)
5. Click **"Create Campaign"**
6. Click **"Send"** to start sending

### Create Templates
1. Go to **Templates** → **New Template**
2. Enter template name
3. Write your HTML email content
4. Use variables like `{{name}}`, `{{email}}` for personalization
5. Save the template

## 💾 Data Storage

All your data is stored locally at:
```
~/Library/Application Support/NovaMailer/novamailer.db
```

This includes:
- User accounts
- Campaigns
- Templates
- Recipients
- SMTP configurations

## 🔧 Troubleshooting

### App Won't Open
**Problem:** "NovaMailer can't be opened because it is from an unidentified developer"

**Solution:** Follow step 3 above (Right-click → Open)

### Backend Not Starting
**Problem:** App opens but shows connection errors

**Solution:** 
- Wait 60 seconds for first-time setup
- Check Activity Monitor for Python processes
- Restart the app

### Port Already in Use
**Problem:** "Port 8000 or 3000 already in use"

**Solution:**
```bash
# Kill processes on port 8000
lsof -ti:8000 | xargs kill -9

# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9
```

### Reset Everything
**Problem:** App is broken or corrupted

**Solution:**
1. Quit NovaMailer
2. Delete: `~/Library/Application Support/NovaMailer/`
3. Restart NovaMailer (fresh database will be created)

## 🎯 Features

- ✉️ **Bulk Email Campaigns** - Send personalized emails to thousands
- 📝 **HTML Templates** - Create beautiful email templates
- 📊 **Campaign Tracking** - Monitor sent, failed, and pending emails
- 📁 **CSV Import** - Upload recipient lists from CSV files
- 🔐 **Secure** - All data stored locally, no cloud required
- 🚀 **Fast** - Native desktop performance

## 📋 System Requirements

- **macOS:** 10.13 (High Sierra) or later
- **Architecture:** Intel x64 (64-bit)
- **RAM:** 4GB minimum, 8GB recommended
- **Disk Space:** 500MB for app + data
- **Internet:** Required only for sending emails via SMTP

## 🆘 Support

If you encounter issues:

1. Check the Console app for error logs
2. Look for "NovaMailer" or "Electron" entries
3. Check backend logs in the app's data directory

## 🔄 Updates

To update NovaMailer:
1. Download the new DMG file
2. Quit the current NovaMailer app
3. Replace the app in Applications folder
4. Your data will be preserved

## 📄 License

MIT License - Free to use and modify

---

**Enjoy using NovaMailer! 🚀**

For questions or issues, check the project documentation.
