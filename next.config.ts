import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['*'], bodySizeLimit: '10mb' },
  },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
}

export default nextConfig
