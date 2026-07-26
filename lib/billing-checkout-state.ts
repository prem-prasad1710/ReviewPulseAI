import type { BillingSummary } from '@/lib/billing-summary'

/** Razorpay subscription states that can mean "pay now" — but not after order-first checkout. */
const RESUMABLE_RAZORPAY_STATUSES = new Set(['created', 'authenticated', 'pending', 'halted'])

/**
 * Order-first billing: first month is paid via Orders API; the Razorpay subscription stays
 * `created` until `start_at` (next month). Hide resume banner when first month is already paid.
 */
export function needsCheckoutResume(summary: BillingSummary): boolean {
  if (!summary.primarySubscriptionId || !summary.primaryLive) return false
  if (!RESUMABLE_RAZORPAY_STATUSES.has(summary.primaryLive.status)) return false

  const dbPrimary = summary.subscriptions.find(
    (s) => s.razorpaySubscriptionId === summary.primarySubscriptionId
  )

  if (dbPrimary?.firstPaymentId || dbPrimary?.firstOrderId) return false
  if (summary.subscriptionStatus === 'active' && summary.plan !== 'free') return false

  return true
}
