#!/bin/bash
# ============================================================
#  NovaMailer Desktop Builder
#  Frontend-only Electron app — connects to EC2 backend
#
#  Usage:
#    ./build-desktop.sh           → auto-detect current OS
#    ./build-desktop.sh mac       → macOS DMG (x64 + arm64)
#    ./build-desktop.sh win       → Windows NSIS installer + portable
#    ./build-desktop.sh linux     → Linux AppImage + .deb
#    ./build-desktop.sh all       → all platforms
#
#  Optional env vars:
#    NOVAMAILER_API_URL=http://your-ec2:8000/api/v1
# ============================================================

set -e

PLATFORM="${1:-auto}"
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
ELECTRON_DIR="$ROOT_DIR/electron"
FRONTEND_DIR="$ROOT_DIR/frontend"
DIST_DIR="$ELECTRON_DIR/dist"

# EC2 backend URL — change this to your EC2 public IP/domain
EC2_API_URL="${NOVAMAILER_API_URL:-http://18.208.181.220:8000/api/v1}"

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${BLUE}▶${NC}  $1"; }
ok()   { echo -e "${GREEN}✔${NC}  $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
err()  { echo -e "${RED}✖${NC}  $1"; exit 1; }
sep()  { echo -e "${CYAN}────────────────────────────────────────────────${NC}"; }

# ── Banner ────────────────────────────────────────────────────────────────────
clear
echo ""
echo -e "${BOLD}${CYAN}  NovaMailer Desktop Builder${NC}"
echo -e "  Frontend → Electron → Native Installer"
echo ""

# ── Auto-detect platform ──────────────────────────────────────────────────────
if [ "$PLATFORM" = "auto" ]; then
  case "$OSTYPE" in
    darwin*)            PLATFORM="mac" ;;
    linux*)             PLATFORM="linux" ;;
    msys*|cygwin*|win*) PLATFORM="win" ;;
    *)                  PLATFORM="mac" ;;
  esac
fi

sep
log "Platform  : ${BOLD}$PLATFORM${NC}"
log "EC2 API   : ${BOLD}$EC2_API_URL${NC}"
log "Output    : $DIST_DIR"
sep
echo ""

# Sanity check — make sure EC2 URL is not localhost
if echo "$EC2_API_URL" | grep -q "localhost"; then
  warn "EC2_API_URL points to localhost — the built app won't reach your server!"
  warn "Set NOVAMAILER_API_URL=http://your-ec2-ip:8000/api/v1 before running this script"
  echo ""
fi

# ── Prerequisites ─────────────────────────────────────────────────────────────
log "Checking prerequisites..."
command -v node >/dev/null 2>&1 || err "Node.js not found → https://nodejs.org"
command -v npm  >/dev/null 2>&1 || err "npm not found"
ok "Node $(node --version)  /  npm $(npm --version)"
echo ""

# ── Copy icon ─────────────────────────────────────────────────────────────────
log "Setting up icon..."
if [ -f "$ROOT_DIR/Novamailer-icon.png" ]; then
  cp "$ROOT_DIR/Novamailer-icon.png" "$ELECTRON_DIR/icon.png"
  ok "Novamailer-icon.png → electron/icon.png"
elif [ -f "$ELECTRON_DIR/icon.png" ]; then
  ok "Icon already at electron/icon.png"
else
  warn "No icon found — default Electron icon will be used"
fi
echo ""

# ── Frontend deps ─────────────────────────────────────────────────────────────
log "Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm install --silent
ok "Frontend deps ready"
echo ""

# ── Build Next.js standalone ──────────────────────────────────────────────────
log "Building Next.js (standalone output)..."
cd "$FRONTEND_DIR"
# EC2 URL is injected at runtime by Electron preload — no need to bake it in.
# Just ensure .env.production exists so Next.js doesn't complain.
echo "NEXT_PUBLIC_API_URL=$EC2_API_URL" > "$FRONTEND_DIR/.env.production"
npm run build
ok "Next.js build complete → frontend/.next/standalone"
echo ""

# ── Electron deps ─────────────────────────────────────────────────────────────
log "Installing Electron dependencies..."
cd "$ELECTRON_DIR"
npm install --silent
ok "Electron deps ready"
echo ""

# ── Package ───────────────────────────────────────────────────────────────────
sep
log "Packaging ${BOLD}$PLATFORM${NC} installer..."
echo ""

case "$PLATFORM" in
  mac)   npm run build:mac:all ;;
  win)   npm run build:win ;;
  linux) npm run build:linux ;;
  all)   npm run build:all ;;
  *)     err "Unknown platform: $PLATFORM  (use: mac | win | linux | all)" ;;
esac

# ── Summary ───────────────────────────────────────────────────────────────────
sep
echo ""
echo -e "${GREEN}${BOLD}✔  Build complete!${NC}"
echo ""
echo -e "${BOLD}Installers:${NC}"
find "$DIST_DIR" -maxdepth 1 \( -name "*.dmg" -o -name "*.exe" -o -name "*.AppImage" -o -name "*.deb" -o -name "*.zip" \) 2>/dev/null | sort | while read f; do
  SIZE=$(du -sh "$f" 2>/dev/null | cut -f1)
  echo -e "  ${GREEN}→${NC} $(basename "$f")  ${CYAN}($SIZE)${NC}"
done
echo ""
echo -e "${BOLD}Install instructions:${NC}"
case "$PLATFORM" in
  mac)
    echo "  1. Open the .dmg file"
    echo "  2. Drag NovaMailer → Applications"
    echo "  3. First launch: right-click → Open (bypasses Gatekeeper)"
    ;;
  win)
    echo "  1. Run NovaMailer-Setup-*.exe"
    echo "  2. Click Next → Next → Install → Finish"
    echo "  3. NovaMailer launches automatically"
    ;;
  linux)
    echo "  AppImage : chmod +x NovaMailer-*.AppImage && ./NovaMailer-*.AppImage"
    echo "  Debian   : sudo dpkg -i novamailer_*.deb"
    ;;
esac
echo ""
echo -e "  Backend: ${CYAN}$EC2_API_URL${NC}"
echo ""
