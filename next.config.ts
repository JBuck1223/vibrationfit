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
  // Prevent caching issues in production
  generateBuildId: async () => {
    // Use timestamp to ensure unique builds
    return `build-${Date.now()}`
  },
};

export default nextConfig;
