// Polyfill broken localStorage in Node environment
if (typeof global !== 'undefined') {
  try {
    // @ts-ignore
    if (global.localStorage && typeof global.localStorage.getItem !== 'function') {
      const noopStorage = {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { },
        clear: () => { },
        key: () => null,
        length: 0,
      };
      Object.defineProperty(global, 'localStorage', {
        value: noopStorage,
        configurable: true,
        writable: true
      });
    }
  } catch (e) {
    // ignore
  }
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Disable ESLint during builds (optional, remove if you want strict checks)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during builds (optional, remove if you want strict checks)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
