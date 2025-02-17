import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  async rewrites() {
    return [
      {
        source: '/music/:path*',
        destination: '/api/music/:path*',
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: false,
  }
};

export const PORT = 4000;
process.env.PORT = PORT.toString();

export default nextConfig;
