import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3']
  }
};

export const PORT = 6666;
process.env.PORT = PORT.toString();

export default nextConfig;
