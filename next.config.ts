import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@aws-sdk/client-s3'],
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.vibrationfit.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
