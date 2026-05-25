import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { type NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'

/** App version from package.json at runtime (bundled filesystem on Node). */
function appVersion(): string {
  try {
    const raw = readFileSync(join(process.cwd(), 'package.json'), 'utf8')
    const v = JSON.parse(raw) as { version?: string }
    return v.version ?? '0.1.0'
  } catch {
    return '0.1.0'
  }
}

/**
 * Operational health for load balancers and uptime monitors.
 *
 * - `GET /api/health?live=1` — cheap liveness (no DB handshake). Use when Mongo is flaky or omitted.
 * - `GET /api/health` (default) — readiness: attempts MongoDB connectivity when URIs/config allow it.
 *
 * Responses never include secrets.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const started = Date.now()
  const version = appVersion()

  if (url.searchParams.get('live') === '1') {
    return NextResponse.json(
      {
        ok: true,
        mode: 'live',
        service: 'reviewpulse',
        version,
        uptimeSeconds: Math.round(process.uptime?.() ?? 0),
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }

  let database: 'connected' | 'error' | 'skipped' = 'skipped'

  try {
    const isProd = process.env.NODE_ENV === 'production'
    if (isProd && !process.env.MONGODB_URI?.trim()) {
      database = 'error'
    } else if (
      Boolean(process.env.MONGODB_URI?.trim()) ||
      (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_MONGO === 'true')
    ) {
      await connectDB()
      database = mongoose.connection.readyState === 1 ? 'connected' : 'error'
    }
  } catch {
    database = 'error'
  }

  const ok = database !== 'error'
  const status = ok ? 200 : 503

  return NextResponse.json(
    {
      ok,
      mode: 'ready',
      service: 'reviewpulse',
      version,
      database,
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    },
    { status, headers: { 'Cache-Control': 'no-store, max-age=0' } }
  )
}
