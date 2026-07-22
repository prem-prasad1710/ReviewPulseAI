import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { getRazorpayConfigStatus } from '@/lib/razorpay'

/** Authenticated billing readiness check — no secrets returned. */
export async function GET() {
  try {
    await requireAuth()
    const status = getRazorpayConfigStatus()
    return NextResponse.json(status, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
