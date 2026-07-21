import { NextResponse } from 'next/server'
import { getRazorpayConfigStatus } from '@/lib/razorpay'

/** Public billing readiness check — no secrets returned. */
export async function GET() {
  const status = getRazorpayConfigStatus()
  return NextResponse.json(status, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
