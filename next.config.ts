import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['better-sqlite3'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  }
};

export const PORT = 4000;
process.env.PORT = PORT.toString();

export default nextConfig;
