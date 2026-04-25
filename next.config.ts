import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Pass server-only env vars to Next.js build
  // (NEXT_PUBLIC_* are auto-exposed to the client)
  serverExternalPackages: ['@octokit/rest', '@octokit/auth-app'],

  // Supabase image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

export default nextConfig
