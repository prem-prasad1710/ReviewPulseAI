import { addMonths } from 'date-fns'
import { EXPECTED_PLAN_AMOUNT_PAISE } from '@/lib/razorpay-plan-validation'
import type { RazorpayPlanKey } from '@/lib/razorpay'

export const RAZORPAY_PLAN_CHECKOUT_NAMES: Record<RazorpayPlanKey, string> = {
  starter: 'ReviewsPulse Starter',
  growth: 'ReviewsPulse Growth',
  scale: 'ReviewsPulse Scale',
  agency: 'ReviewsPulse Agency',
  agency_addon: 'ReviewsPulse Agency — extra location',
}

/**
 * Razorpay subscription checkout defaults to a ₹1–₹5 mandate auth unless an upfront
 * addon is set. We collect the first month now via addon and start recurring billing
 * from the next cycle to avoid double-charging month one.
 */
export function buildRazorpaySubscriptionCreatePayload(
  planKey: RazorpayPlanKey,
  razorpayPlanId: string,
  customerId: string,
  userId: string
) {
  const amountPaise = EXPECTED_PLAN_AMOUNT_PAISE[planKey]
  const startAt = Math.floor(addMonths(new Date(), 1).getTime() / 1000)

  return {
    plan_id: razorpayPlanId,
    customer_id: customerId,
    customer_notify: 1,
    total_count: 120,
    start_at: startAt,
    addons: [
      {
        item: {
          name: `${RAZORPAY_PLAN_CHECKOUT_NAMES[planKey]} — first month`,
          amount: amountPaise,
          currency: 'INR',
        },
      },
    ],
    notes: {
      userId,
      plan: planKey,
      firstMonthPaise: String(amountPaise),
    },
  }
}
