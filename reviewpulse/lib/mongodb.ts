import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { loadEnvConfig } from '@next/env'
import mongoose from 'mongoose'

declare global {
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined
}

const cached = global.mongooseCache ?? { conn: null, promise: null }

if (!global.mongooseCache) {
  global.mongooseCache = cached
}

let didLoadReviewpulseEnv = false

/** Next sometimes uses a parent folder as workspace root; then this app's .env is never applied. */
function ensureReviewpulseEnvLoaded() {
  if (didLoadReviewpulseEnv) return
  didLoadReviewpulseEnv = true

  let dir = process.cwd()
  for (let depth = 0; depth < 10; depth++) {
    const candidates = [dir, path.join(dir, 'reviewpulse')]
    for (const root of candidates) {
      const pkgPath = path.join(root, 'package.json')
      const envPath = path.join(root, '.env')
      if (!existsSync(pkgPath) || !existsSync(envPath)) continue
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string }
        if (pkg.name !== 'reviewpulse') continue
      } catch {
        continue
      }
      loadEnvConfig(root)
      return
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  loadEnvConfig(process.cwd())
}

/**
 * In development, set USE_LOCAL_MONGO=true to use a local mongod instead of Atlas
 * (avoids Atlas IP allowlist).
 *
 * MONGODB_URI_LOCAL (optional): full URI if you do not want defaults.
 * LOCAL_MONGO_HOST_PORT (optional): host port published by Podman (default 27018 — avoids brew mongod on 27017).
 */
function defaultLocalMongoPort() {
  const p = process.env.LOCAL_MONGO_HOST_PORT?.trim()
  return p && p.length > 0 ? p : '27018'
}

function resolveMongoUri(): string {
  const isDev = process.env.NODE_ENV === 'development'
  const useLocal = process.env.USE_LOCAL_MONGO === 'true'

  if (isDev && useLocal) {
    const hostPort = defaultLocalMongoPort()
    if (process.env.USE_LOCAL_MONGO_NO_AUTH === 'true') {
      return process.env.MONGODB_URI_LOCAL ?? `mongodb://127.0.0.1:${hostPort}`
    }
    // Root user from infra/local-mongo / npm run mongo:local:up — `/admin` sets default auth DB for SCRAM.
    return (
      process.env.MONGODB_URI_LOCAL ??
      `mongodb://localuser:localuser@127.0.0.1:${hostPort}/admin?directConnection=true&authSource=admin`
    )
  }

  const atlas = process.env.MONGODB_URI
  if (!atlas) {
    throw new Error(
      'Missing MONGODB_URI. For local dev without Atlas: USE_LOCAL_MONGO=true (and optional MONGODB_URI_LOCAL).'
    )
  }
  return atlas
}

export async function connectDB() {
  ensureReviewpulseEnvLoaded()
  const uri = resolveMongoUri()

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      autoIndex: true,
      dbName: process.env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
