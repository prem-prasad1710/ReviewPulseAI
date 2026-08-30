import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { getRazorpayConfigStatus } from '@/lib/razorpay'
import { checkRazorpayPlanHealth } from '@/lib/razorpay-plan-health'

/** Authenticated billing readiness check — no secrets returned. */
export async function GET() {
  try {
    await requireAuth()
    const status = getRazorpayConfigStatus()
    let planHealth: Awaited<ReturnType<typeof checkRazorpayPlanHealth>> | undefined

    if (status.configured) {
      try {
        planHealth = await checkRazorpayPlanHealth()
      } catch {
        planHealth = undefined
      }
    }

    return NextResponse.json(
      {
        ...status,
        planHealth,
        plansVerified: planHealth ? planHealth.every((p) => p.ok) : false,
      },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    )
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
