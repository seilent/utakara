import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['better-sqlite3']
};

export const PORT = 4000;
process.env.PORT = PORT.toString();

export default nextConfig;
