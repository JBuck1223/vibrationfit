import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@aws-sdk/client-s3', '@sparticuz/chromium', 'puppeteer-core', 'puppeteer'],
  async redirects() {
    return [
      {
        source: '/alignment-gym/survey',
        destination: '/survey/alignment-gym',
        permanent: false,
      },
      {
        source: '/alignment-gym/scheduling',
        destination: '/survey/alignment-gym',
        permanent: false,
      },
    ]
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
