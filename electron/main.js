const { app, BrowserWindow, Menu, dialog, nativeImage, shell, session } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const waitOn = require('wait-on');

let mainWindow;
let splashWindow;
let frontendProcess;
let isStarting = false;

const isDev = process.env.NODE_ENV === 'development';
const FRONTEND_PORT = 3000;

// EC2 backend URL — injected into every renderer via preload.js
const EC2_API_URL = process.env.NOVAMAILER_API_URL || 'http://18.208.181.220:8000/api/v1';

// Make it available to preload.js via process.env
process.env.NOVAMAILER_API_URL = EC2_API_URL;

// ── Icon ──────────────────────────────────────────────────────────────────────
function getIconPath() {
  const candidates = [
    path.join(__dirname, 'icon.png'),
    path.join(process.resourcesPath || '', 'app', 'icon.png'),
    path.join(process.resourcesPath || '', 'icon.png'),
  ];
  return candidates.find(p => fs.existsSync(p)) || candidates[0];
}

// ── Splash ────────────────────────────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 460,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    icon: getIconPath(),
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });

  const iconPath = getIconPath();
  const iconDataUrl = fs.existsSync(iconPath)
    ? 'data:image/png;base64,' + fs.readFileSync(iconPath).toString('base64')
    : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:linear-gradient(135deg,#1e1e2e,#2d2d44);border-radius:16px;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      color:#fff;border:1px solid rgba(255,255,255,.1);-webkit-app-region:drag}
    img{width:88px;height:88px;border-radius:18px;margin-bottom:16px;
      box-shadow:0 8px 32px rgba(0,0,0,.5)}
    h1{font-size:26px;font-weight:700;margin-bottom:4px}
    .sub{font-size:12px;color:rgba(255,255,255,.5);margin-bottom:28px}
    .track{width:220px;height:3px;background:rgba(255,255,255,.1);border-radius:2px;overflow:hidden}
    .bar{height:100%;width:0;background:linear-gradient(90deg,#6366f1,#8b5cf6);
      border-radius:2px;animation:go 2.5s ease-in-out forwards}
    @keyframes go{0%{width:0}50%{width:70%}100%{width:92%}}
    .status{font-size:11px;color:rgba(255,255,255,.35);margin-top:10px}
  </style></head><body>
    ${iconDataUrl ? `<img src="${iconDataUrl}" alt="">` : ''}
    <h1>NovaMailer</h1>
    <div class="sub">Email Campaign Manager</div>
    <div class="track"><div class="bar"></div></div>
    <div class="status" id="s">Connecting to server...</div>
    <script>
      const {ipcRenderer}=require('electron');
      ipcRenderer.on('status',(e,m)=>{document.getElementById('s').textContent=m});
    </script>
  </body></html>`;

  const tmp = path.join(app.getPath('temp'), 'nm-splash.html');
  fs.writeFileSync(tmp, html);
  splashWindow.loadFile(tmp);
}

function setSplashStatus(msg) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('status', msg);
  }
}

// ── Main window ───────────────────────────────────────────────────────────────
function createWindow() {
  const iconPath = getIconPath();
  const icon = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : undefined;

  // Use a persistent session so localStorage/cookies survive app restarts
  const persistentSession = session.fromPartition('persist:novamailer', { cache: true });

  // Restore previous window size/position
  let windowBounds = { width: 1400, height: 900 };
  try {
    const stateFile = path.join(app.getPath('userData'), 'window-state.json');
    if (fs.existsSync(stateFile)) {
      windowBounds = { ...windowBounds, ...JSON.parse(fs.readFileSync(stateFile, 'utf8')) };
    }
  } catch {}

  mainWindow = new BrowserWindow({
    ...windowBounds,
    minWidth: 900,
    minHeight: 600,
    show: false,
    icon,
    title: 'NovaMailer',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      session: persistentSession,
    },
  });

  const menuTemplate = [
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { role: 'about' }, { type: 'separator' },
        { role: 'services' }, { type: 'separator' },
        { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' },
        { type: 'separator' }, { role: 'quit' },
      ],
    }] : []),
    {
      label: 'File',
      submenu: [process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' }],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' }, { role: 'forceReload' },
        { label: 'Developer Tools', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' }, { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Report Issue', click: () => shell.openExternal('https://github.com/novamailer/novamailer/issues') },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

  mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  // Save window bounds on close so next launch restores position/size
  mainWindow.on('close', () => {
    const bounds = mainWindow.getBounds();
    try {
      const stateFile = path.join(app.getPath('userData'), 'window-state.json');
      fs.writeFileSync(stateFile, JSON.stringify(bounds));
    } catch {}
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Frontend (Next.js standalone) ─────────────────────────────────────────────
function startFrontend() {
  return new Promise((resolve, reject) => {
    setSplashStatus('Starting app...');

    const frontendPath = isDev
      ? path.join(__dirname, '..', 'frontend')
      : path.join(process.resourcesPath, 'frontend');

    if (isDev) {
      // Dev: use npm run dev
      frontendProcess = spawn('npm', ['run', 'dev'], {
        cwd: frontendPath,
        shell: true,
        env: { ...process.env, NEXT_PUBLIC_API_URL: EC2_API_URL },
      });
    } else {
      // Production: run the standalone server.js with Electron's Node
      const serverPath = path.join(frontendPath, 'server.js');
      if (!fs.existsSync(serverPath)) {
        return reject(new Error(`server.js not found at ${serverPath}.\nRun ./build-desktop.sh first.`));
      }
      frontendProcess = spawn(process.execPath, [serverPath], {
        cwd: frontendPath,
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: '1',
          NEXT_PUBLIC_API_URL: EC2_API_URL,
          PORT: String(FRONTEND_PORT),
          HOSTNAME: '127.0.0.1',
        },
      });
    }

    frontendProcess.stdout.on('data', d => process.stdout.write(`[frontend] ${d}`));
    frontendProcess.stderr.on('data', d => process.stderr.write(`[frontend] ${d}`));
    frontendProcess.on('close', code => { console.log(`Frontend exited: ${code}`); frontendProcess = null; });
    frontendProcess.on('error', err => { frontendProcess = null; reject(err); });

    waitOn({ resources: [`http://127.0.0.1:${FRONTEND_PORT}`], timeout: 60000 })
      .then(() => { setSplashStatus('Launching NovaMailer...'); resolve(); })
      .catch(err => reject(new Error(`Frontend failed to start: ${err.message}`)));
  });
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    if (isStarting) return;
    isStarting = true;
    createSplash();
    try {
      await startFrontend();
      createWindow();
    } catch (err) {
      console.error('Startup error:', err);
      if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
      dialog.showErrorBox('NovaMailer — Startup Error', `${err.message}`);
      app.quit();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (!mainWindow) createWindow();
  });

  app.on('before-quit', () => {
    frontendProcess?.kill();
  });
}
