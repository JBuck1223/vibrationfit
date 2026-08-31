import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@aws-sdk/client-s3', '@sparticuz/chromium', 'puppeteer-core', 'puppeteer', 'ffmpeg-static'],
  // Ensure the static ffmpeg binary is shipped to the serverless function.
  outputFileTracingIncludes: {
    '/api/songs/upload-reference': ['./node_modules/ffmpeg-static/ffmpeg'],
  },
  async redirects() {
    return [
      {
        // Short links for the free guide PDF
        source: '/downloads/100k.pdf',
        destination: '/downloads/from-100k-in-debt-to-100k-in-the-bank.pdf',
        permanent: false,
      },
      {
        source: '/100k.pdf',
        destination: '/downloads/from-100k-in-debt-to-100k-in-the-bank.pdf',
        permanent: false,
      },
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
  // Production: commit SHA so chunks bust on a new deploy without a unique
  // timestamp, which invalidated Vercel's restored webpack cache and helped
  // the 2e8f5a47 production build hang until BUILD_EXCEEDED_MAXIMUM_TIME.
  // Development: stable id so HTML and chunk paths stay aligned if the dev server re-reads config.
  generateBuildId: async () => {
    if (process.env.NODE_ENV === 'development') {
      return 'dev'
    }
    return process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || `build-${Date.now()}`
  },
};

export default nextConfig;
