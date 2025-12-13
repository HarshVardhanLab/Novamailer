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
