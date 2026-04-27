import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvConfig } from '@next/env'
import type { NextConfig } from 'next'

const appDir = path.dirname(fileURLToPath(import.meta.url))

// Load `.env*` from this app folder. Next can infer a parent directory as the workspace root when
// multiple lockfiles exist; that skips reviewpulse env vars and breaks Mongo. Do not set
// `turbopack.root` here — it breaks resolving `tailwindcss` from this package (see Next #90307).
loadEnvConfig(appDir)

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    const headers = [...securityHeaders]
    if (process.env.ENABLE_HSTS === 'true') {
      headers.push({ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' })
    }
    return [
      {
        source: '/score/:slug/embed',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
        ],
      },
      { source: '/:path*', headers },
    ]
  },
}

export default nextConfig
