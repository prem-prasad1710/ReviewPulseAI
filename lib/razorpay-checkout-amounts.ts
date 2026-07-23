import { PLAN_LIMITS } from '@/lib/plans'
import type { RazorpayPlanKey } from '@/lib/razorpay'

/** First-month order amount in paise — safe for client + server. */
export const PLAN_CHECKOUT_AMOUNT_PAISE: Record<RazorpayPlanKey, number> = {
  starter: PLAN_LIMITS.starter.price * 100,
  growth: PLAN_LIMITS.growth.price * 100,
  scale: PLAN_LIMITS.scale.price * 100,
  agency: PLAN_LIMITS.agency.price * 100,
  agency_addon: 299 * 100,
}

export function formatCheckoutInr(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    paise / 100
  )
}

/** Returns an error message when the server amount does not match the plan price. */
export function checkoutAmountMismatch(plan: RazorpayPlanKey, amountPaise: number): string | null {
  const expected = PLAN_CHECKOUT_AMOUNT_PAISE[plan]
  if (amountPaise === expected) return null
  return `Checkout shows ${formatCheckoutInr(amountPaise)} but ${plan} should be ${formatCheckoutInr(expected)}. Redeploy the app or contact support — do not pay a wrong amount.`
}
