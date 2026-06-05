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
      {
        source: '/dashboard/tokens',
        destination: '/tokens',
        permanent: false,
      },
      {
        source: '/dashboard/tokens/history',
        destination: '/tokens/history',
        permanent: false,
      },
      {
        source: '/admin/ideas',
        destination: '/admin/projects',
        permanent: false,
      },
      {
        source: '/admin/ideas/:path*',
        destination: '/admin/projects/:path*',
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
  // Production: unique id per deploy so CDN/clients do not keep stale chunks.
  // Development: stable id so HTML and chunk paths stay aligned if the dev server re-reads config.
  generateBuildId: async () => {
    if (process.env.NODE_ENV === 'development') {
      return 'dev'
    }
    return `build-${Date.now()}`
  },
};

export default nextConfig;
