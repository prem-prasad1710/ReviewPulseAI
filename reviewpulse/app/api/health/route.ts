import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'

/**
 * Liveness/readiness for load balancers and uptime checks.
 * Does not expose secrets or user data.
 */
export async function GET() {
  const started = Date.now()
  let database: 'connected' | 'error' | 'skipped' = 'skipped'

  try {
    if (process.env.MONGODB_URI) {
      await connectDB()
      if (mongoose.connection.readyState === 1) {
        database = 'connected'
      } else {
        database = 'error'
      }
    }
  } catch {
    database = 'error'
  }

  const ok = database !== 'error'
  const status = ok ? 200 : 503

  return NextResponse.json(
    {
      ok,
      service: 'reviewpulse',
      database,
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    },
    { status, headers: { 'Cache-Control': 'no-store, max-age=0' } }
  )
}
