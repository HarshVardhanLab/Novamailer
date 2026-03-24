# NovaMailer Desktop App - Installation Guide

## 📦 Built Applications

Your NovaMailer desktop application has been successfully built! You'll find the installers in:

```
electron/dist/
├── NovaMailer-1.0.0.dmg          (Intel Mac - x64)
├── NovaMailer-1.0.0-arm64.dmg    (Apple Silicon - M1/M2/M3)
```

## 🍎 macOS Installation

### For Apple Silicon Macs (M1/M2/M3):
1. Open `electron/dist/NovaMailer-1.0.0-arm64.dmg`
2. Drag NovaMailer to your Applications folder
3. Double-click NovaMailer in Applications to launch

### For Intel Macs:
1. Open `electron/dist/NovaMailer-1.0.0.dmg`
2. Drag NovaMailer to your Applications folder
3. Double-click NovaMailer in Applications to launch

### First Launch

When you first open the app, macOS may show a security warning because the app isn't signed with an Apple Developer certificate.

**To bypass this:**
1. Right-click (or Control+click) on NovaMailer in Applications
2. Select "Open" from the menu
3. Click "Open" in the dialog that appears
4. The app will launch and remember this choice

## ✨ Features

The desktop app includes:
- ✅ Complete NovaMailer functionality
- ✅ Python backend (FastAPI) bundled
- ✅ Next.js frontend bundled
- ✅ Local SQLite database
- ✅ No internet required (except for sending emails via SMTP)
- ✅ All data stored locally on your computer

## 🗄️ Data Location

Your data is stored in:
```
~/Library/Application Support/NovaMailer/novamailer.db
```

## 🚀 First Time Setup

1. Launch NovaMailer
2. Click "Register" to create your account
3. Fill in your email and password
4. Configure SMTP settings in Settings to send emails

## 📧 SMTP Configuration

To send emails, you need to configure SMTP:

1. Go to Settings → SMTP Configuration
2. Enter your SMTP details:
   - **Gmail**: smtp.gmail.com, port 587
   - **Outlook**: smtp-mail.outlook.com, port 587
   - Use an App Password (not your regular password)

## 🔧 Troubleshooting

### App won't open
- Make sure you followed the "First Launch" steps above
- Check System Settings → Privacy & Security for any blocks

### Backend not starting
- The app creates a Python virtual environment on first run
- This may take a minute - be patient
- Check Console.app for error logs

### Database issues
- Delete `~/Library/Application Support/NovaMailer/novamailer.db`
- Restart the app to create a fresh database

## 📝 Development

To rebuild the app after making changes:

```bash
# Build frontend
cd frontend
npm run build
cd ..

# Build desktop app
cd electron
npm run build:mac
```

## 🎨 Customization

To add a custom icon:
1. Create a 512x512 PNG icon
2. Save it as `electron/icon.icns` (macOS) or `electron/icon.png`
3. Update `electron/package.json` build configuration
4. Rebuild the app

## 📦 Distribution

You can distribute the DMG files to other users. They can install and use the app without needing:
- Node.js
- Python
- Any development tools

Everything is bundled!

## 🔐 Code Signing (Optional)

For production distribution, you should sign the app with an Apple Developer certificate:

1. Enroll in Apple Developer Program ($99/year)
2. Create a Developer ID Application certificate
3. Update `electron/package.json` with your certificate details
4. Rebuild the app

Signed apps won't show security warnings and can be distributed more easily.

## 📄 License

MIT License - Feel free to modify and distribute!

---

**Enjoy using NovaMailer Desktop! 🚀**
