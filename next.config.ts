import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@mastra/core',
    '@mastra/evals',
    '@mastra/libsql',
    '@mastra/memory',
    '@mastra/pg',
    '@mastra/rag',
    '@libsql/client',
  ],
}

export default nextConfig
