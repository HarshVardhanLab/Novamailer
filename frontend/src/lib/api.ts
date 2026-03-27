import axios from 'axios';
import { safeLocalStorage } from './storage';

/**
 * API base URL resolution — works in all environments:
 *
 * 1. Electron desktop (production): window.__NOVAMAILER_API_URL__ injected by preload.js
 * 2. Build-time env var: NEXT_PUBLIC_API_URL (baked into bundle)
 * 3. Runtime fallback: localhost for local dev
 */
function getBaseURL(): string {
  // Electron injects this via preload before the page loads
  if (typeof window !== 'undefined' && (window as any).__NOVAMAILER_API_URL__) {
    return (window as any).__NOVAMAILER_API_URL__;
  }
  // Next.js build-time env (works for web deployments)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://localhost:8000/api/v1';
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  // Re-resolve URL on every request so Electron injection is always picked up
  config.baseURL = getBaseURL();
  const token = safeLocalStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
