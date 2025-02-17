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
  },
  // Add headers for auth cookies
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://uta.seilent.net',
          },
        ],
      },
    ];
  }
};

export const PORT = 4000;
process.env.PORT = PORT.toString();

export default nextConfig;
