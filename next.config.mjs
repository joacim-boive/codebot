/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverComponentsExternalPackages: ['knex', 'ws'],
  },
}

export default nextConfig
