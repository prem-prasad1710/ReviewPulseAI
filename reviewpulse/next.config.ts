import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvConfig } from '@next/env'
import type { NextConfig } from 'next'

const appDir = path.dirname(fileURLToPath(import.meta.url))

// Load `.env*` from this app folder. Next can infer a parent directory as the workspace root when
// multiple lockfiles exist; that skips reviewpulse env vars and breaks Mongo. Do not set
// `turbopack.root` here — it breaks resolving `tailwindcss` from this package (see Next #90307).
loadEnvConfig(appDir)

const nextConfig: NextConfig = {}

export default nextConfig
