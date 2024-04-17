/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['knex'],
  },
}

export default nextConfig
