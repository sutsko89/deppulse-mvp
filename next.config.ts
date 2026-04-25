import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Skip TypeScript errors during build (MVP — types checked in CI/IDE)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

export default nextConfig
