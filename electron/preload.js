const { contextBridge } = require('electron');

// EC2 backend URL — set by main.js via process.env before the window loads
const apiUrl = process.env.NOVAMAILER_API_URL || 'http://18.208.181.220:8000/api/v1';

// Inject into window so api.ts can read it at runtime (bypasses Next.js build-time baking)
contextBridge.exposeInMainWorld('__NOVAMAILER_API_URL__', apiUrl);

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  version: process.versions.electron,
  apiUrl,
});
