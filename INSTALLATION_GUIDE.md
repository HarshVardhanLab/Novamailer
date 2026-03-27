# NovaMailer Desktop — Installation Guide

NovaMailer Desktop is a lightweight Electron app that wraps the Next.js frontend.
It connects to your EC2-hosted backend automatically — no Python, no local server needed.

---

## macOS

### Install
1. Download `NovaMailer-2.0.0.dmg` (Intel) or `NovaMailer-2.0.0-arm64.dmg` (Apple Silicon M1/M2/M3)
2. Double-click the `.dmg` to open it
3. Drag **NovaMailer** into the **Applications** folder
4. Eject the disk image

### First Launch (Gatekeeper bypass)
Because the app isn't signed with an Apple Developer certificate, macOS will block it the first time:

1. Open **Finder → Applications**
2. **Right-click** NovaMailer → **Open**
3. Click **Open** in the dialog
4. The app launches and macOS remembers your choice — no repeat needed

### Uninstall
Drag NovaMailer from Applications to Trash.

---

## Windows

### Install
1. Download `NovaMailer-Setup-2.0.0.exe`
2. Double-click the installer
3. Click **Next** on the welcome screen
4. Choose install location (default is fine) → **Next**
5. Click **Install**
6. Click **Finish** — NovaMailer launches automatically

A desktop shortcut and Start Menu entry are created automatically.

### Portable (no install)
Download `NovaMailer-2.0.0-portable.exe` and run it directly — no installation, no admin rights needed.

### Uninstall
**Settings → Apps → NovaMailer → Uninstall**
or use **Add/Remove Programs** in Control Panel.

---

## Linux

### AppImage (universal — works on any distro)
```bash
chmod +x NovaMailer-2.0.0.AppImage
./NovaMailer-2.0.0.AppImage
```
To integrate with your desktop launcher, use [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher).

### Debian / Ubuntu (.deb)
```bash
sudo dpkg -i novamailer_2.0.0_amd64.deb
# Launch from Applications menu or:
novamailer
```

### Uninstall
```bash
sudo dpkg -r novamailer
```

---

## First-Time Setup (all platforms)

1. Launch NovaMailer
2. Click **Register** to create your account
3. Go to **Settings** and configure your SMTP credentials to send campaigns
4. That's it — your data lives on the EC2 server

---

## Building from Source

Requirements: Node.js 20+, npm

```bash
# Clone the repo
git clone https://github.com/yourorg/novamailer
cd novamailer

# Build for your current OS
chmod +x build-desktop.sh
./build-desktop.sh

# Build for a specific platform
./build-desktop.sh mac
./build-desktop.sh win
./build-desktop.sh linux

# Override the EC2 backend URL
NOVAMAILER_API_URL=http://your-server:8000/api/v1 ./build-desktop.sh mac
```

Installers are output to `electron/dist/`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| macOS: "app is damaged" | Right-click → Open, or run `xattr -cr /Applications/NovaMailer.app` |
| Windows: SmartScreen warning | Click "More info" → "Run anyway" |
| App shows blank screen | Check your internet connection to the EC2 server |
| Login fails | Verify the EC2 backend is running: `http://18.208.181.220:8000/health` |
