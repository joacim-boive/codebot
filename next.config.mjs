/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['knex', 'ws'],
  },
}

export default nextConfig
