import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@aws-sdk/client-s3'],
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
