import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Increase the maximum request body size for file uploads
    serverComponentsExternalPackages: ['@aws-sdk/client-s3'],
  },
};

export default nextConfig;
