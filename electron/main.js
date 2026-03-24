const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const waitOn = require('wait-on');

let mainWindow;
let backendProcess;
let frontendProcess;
let isStarting = false;

const isDev = process.env.NODE_ENV === 'development';
const BACKEND_PORT = 8000;
const FRONTEND_PORT = 3000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'NovaMailer'
  });

  // Create application menu
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Load the app
  if (isDev) {
    mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  return new Promise((resolve, reject) => {
    if (backendProcess) {
      console.log('Backend already starting/started');
      resolve();
      return;
    }
    
    const backendPath = isDev 
      ? path.join(__dirname, '..', 'backend')
      : path.join(process.resourcesPath, 'backend');

    // In production, we need to create a Python virtual environment on first run
    const pythonExecutable = isDev
      ? path.join(backendPath, 'venv', 'bin', 'python')
      : 'python3'; // Use system Python in production

    console.log('Starting backend from:', backendPath);
    console.log('Python executable:', pythonExecutable);

    // In production, install dependencies if needed
    if (!isDev) {
      const venvPath = path.join(backendPath, 'venv');
      const fs = require('fs');
      
      if (!fs.existsSync(venvPath)) {
        console.log('Creating Python virtual environment...');
        const { execSync } = require('child_process');
        try {
          execSync(`python3 -m venv "${venvPath}"`, { cwd: backendPath });
          const venvPython = path.join(venvPath, 'bin', 'python');
          execSync(`"${venvPython}" -m pip install -r requirements.txt`, { cwd: backendPath });
          console.log('Virtual environment created successfully');
        } catch (error) {
          console.error('Failed to create virtual environment:', error);
          reject(error);
          return;
        }
      }
    }

    const finalPythonPath = isDev
      ? pythonExecutable
      : path.join(backendPath, 'venv', 'bin', 'python');

    backendProcess = spawn(finalPythonPath, [
      '-m', 'uvicorn',
      'main:app',
      '--host', '0.0.0.0',
      '--port', BACKEND_PORT.toString()
    ], {
      cwd: backendPath,
      env: { ...process.env }
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
      backendProcess = null;
    });

    backendProcess.on('error', (error) => {
      console.error('Backend spawn error:', error);
      backendProcess = null;
      reject(error);
    });

    // Wait for backend to be ready
    waitOn({
      resources: [`http://localhost:${BACKEND_PORT}/health`],
      timeout: 30000
    }).then(() => {
      console.log('Backend is ready');
      resolve();
    }).catch((err) => {
      console.error('Backend failed to start:', err);
      reject(err);
    });
  });
}

function startFrontend() {
  return new Promise((resolve, reject) => {
    if (frontendProcess) {
      console.log('Frontend already starting/started');
      resolve();
      return;
    }
    
    const frontendPath = isDev
      ? path.join(__dirname, '..', 'frontend')
      : path.join(process.resourcesPath, 'frontend');

    console.log('Starting frontend from:', frontendPath);

    if (isDev) {
      // Development mode: use npm run dev
      frontendProcess = spawn('npm', ['run', 'dev'], {
        cwd: frontendPath,
        env: { 
          ...process.env,
          NEXT_PUBLIC_API_URL: `http://localhost:${BACKEND_PORT}/api/v1`
        },
        shell: true
      });
    } else {
      // Production mode: use standalone server with bundled node
      const serverPath = path.join(frontendPath, 'server.js');
      const nodePath = process.execPath; // Use Electron's Node.js
      
      console.log('Node path:', nodePath);
      console.log('Server path:', serverPath);
      
      frontendProcess = spawn(nodePath, [serverPath], {
        cwd: frontendPath,
        env: { 
          ...process.env,
          ELECTRON_RUN_AS_NODE: '1',
          NEXT_PUBLIC_API_URL: `http://localhost:${BACKEND_PORT}/api/v1`,
          PORT: FRONTEND_PORT.toString(),
          HOSTNAME: '0.0.0.0'
        }
      });
    }

    frontendProcess.stdout.on('data', (data) => {
      console.log(`Frontend: ${data}`);
    });

    frontendProcess.stderr.on('data', (data) => {
      console.error(`Frontend Error: ${data}`);
    });

    frontendProcess.on('close', (code) => {
      console.log(`Frontend process exited with code ${code}`);
      frontendProcess = null;
    });

    frontendProcess.on('error', (error) => {
      console.error('Frontend spawn error:', error);
      frontendProcess = null;
      reject(error);
    });

    // Wait for frontend to be ready
    waitOn({
      resources: [`http://localhost:${FRONTEND_PORT}`],
      timeout: 60000
    }).then(() => {
      console.log('Frontend is ready');
      resolve();
    }).catch((err) => {
      console.error('Frontend failed to start:', err);
      reject(err);
    });
  });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('ready', async () => {
    if (isStarting) {
      console.log('Already starting, ignoring duplicate ready event');
      return;
    }
    isStarting = true;
    
    try {
      console.log('Starting NovaMailer...');
      console.log('App path:', app.getAppPath());
      console.log('Resources path:', process.resourcesPath);
      
      await startBackend();
      await startFrontend();
      createWindow();
    } catch (error) {
      console.error('Failed to start application:', error);
      dialog.showErrorBox(
        'NovaMailer Startup Error',
        `Failed to start NovaMailer:\n\n${error.message}\n\nCheck Console.app for detailed logs.`
      );
      app.quit();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });

  app.on('before-quit', () => {
    if (backendProcess) {
      backendProcess.kill();
    }
    if (frontendProcess) {
      frontendProcess.kill();
    }
  });
}
