import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { getBillingSummary } from '@/lib/billing-summary'

export async function GET() {
  try {
    const user = await requireAuth()
    const summary = await getBillingSummary(String(user._id))
    if (!summary) return err('Account not found', 404)
    return ok(summary)
  } catch (error) {
    console.error('GET /api/billing/summary failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load billing', 500)
  }
}
