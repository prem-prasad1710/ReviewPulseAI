import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

const appDir = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { loadEnvConfig } = require('@next/env') as { loadEnvConfig: (dir: string) => void }

/** Remotion ships optional compositor binaries; webpack must not resolve other platforms. */
function remotionCompositorPackageForHost(): string {
  if (process.platform === 'darwin' && process.arch === 'arm64') return '@remotion/compositor-darwin-arm64'
  if (process.platform === 'darwin' && process.arch === 'x64') return '@remotion/compositor-darwin-x64'
  if (process.platform === 'win32' && process.arch === 'x64') return '@remotion/compositor-win32-x64-msvc'
  if (process.platform === 'linux' && process.arch === 'arm64') return '@remotion/compositor-linux-arm64-gnu'
  if (process.platform === 'linux' && process.arch === 'x64') return '@remotion/compositor-linux-x64-gnu'
  return '@remotion/compositor-darwin-arm64'
}

// Load `.env*` from this app folder. Next can infer a parent directory as the workspace root when
// multiple lockfiles exist; that skips reviewpulse env vars and breaks Mongo.
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
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  /**
   * When this app lives under a parent folder (e.g. `…/ReviewPulseAI/reviewpulse`), Turbopack can
   * pick the parent as the project root. Then `@import "tailwindcss"` in `app/globals.css`
   * resolves from a path with no `package.json` / `node_modules` → "Can't resolve 'tailwindcss'".
   * Pinning the root to this directory fixes that without changing `outputFileTracingRoot`.
   */
  turbopack: {
    root: appDir,
  },
  /**
   * Local monorepos: trace from this app root. On Vercel, omit — setting this has caused
   * finalize to look for `.next` under `/vercel/path0` while the build landed under `/vercel/output`.
   */
  ...(process.env.VERCEL ? {} : { outputFileTracingRoot: appDir }),
  serverExternalPackages: [
    'remotion',
    '@remotion/bundler',
    '@remotion/renderer',
    'esbuild',
    '@esbuild/darwin-arm64',
    '@esbuild/darwin-x64',
    '@esbuild/linux-arm64',
    '@esbuild/linux-x64',
    '@esbuild/linux-ia32',
    '@esbuild/win32-x64',
  ],
  webpack: (config, { isServer, webpack: wp }) => {
    if (isServer) {
      const keepCompositor = remotionCompositorPackageForHost()
      config.plugins.push(
        new wp.IgnorePlugin({
          checkResource(resource: string) {
            if (typeof resource !== 'string' || !resource.startsWith('@remotion/compositor-')) return false
            return resource !== keepCompositor
          },
        })
      )
      config.plugins.push(
        new wp.IgnorePlugin({
          checkResource(resource: string, context: string) {
            return Boolean(
              resource.endsWith('.md') && typeof context === 'string' && context.includes(`${path.sep}esbuild${path.sep}`)
            )
          },
        })
      )
    }

    // Safety net for "UnhandledSchemeError: Reading from node:* is not handled".
    //
    // config.resolve.alias does NOT intercept node: URIs — webpack throws
    // UnhandledSchemeError BEFORE alias resolution runs. The correct fix is a
    // NormalModuleReplacementPlugin (runs at request-interception time) that
    // strips the "node:" prefix, combined with resolve.fallback to stub those
    // bare built-ins to false (empty module) for browser bundles.
    //
    // Primary fix: break client-side import chains (lib/razorpay-plan-names.ts,
    // lib/plan-limits.ts). This plugin is defence-in-depth for future leaks.
    if (!isServer) {
      config.plugins.push(
        new wp.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
          resource.request = resource.request.replace(/^node:/, '')
        })
      )

      config.resolve.fallback = {
        ...(config.resolve.fallback as Record<string, false> | undefined),
        fs: false,
        path: false,
        module: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        url: false,
        events: false,
        net: false,
        tls: false,
        zlib: false,
        http: false,
        https: false,
        child_process: false,
        worker_threads: false,
        async_hooks: false,
        perf_hooks: false,
        readline: false,
        assert: false,
        string_decoder: false,
        querystring: false,
        vm: false,
        dns: false,
        dgram: false,
      }
    }

    return config
  },
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
