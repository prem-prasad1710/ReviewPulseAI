import { addMonths } from 'date-fns'
import { EXPECTED_PLAN_AMOUNT_PAISE } from '@/lib/razorpay-plan-validation'
import { getRazorpayClient, getRazorpayPlanId, type RazorpayPlanKey } from '@/lib/razorpay'

type RazorpayOrder = { id: string; amount: number; currency: string; notes?: Record<string, string> }

/** Full first-month charge via Orders API (checkout shows correct INR amount). */
export async function createFirstMonthOrder(userId: string, planKey: RazorpayPlanKey): Promise<RazorpayOrder> {
  const rz = getRazorpayClient()
  const amount = EXPECTED_PLAN_AMOUNT_PAISE[planKey]
  const receipt = `rp_${planKey}_${userId.slice(-8)}_${Date.now()}`.slice(0, 40)

  const raw = await rz.orders.create({
    amount,
    currency: 'INR',
    receipt,
    notes: {
      userId,
      plan: planKey,
      checkout: 'first_month',
    },
  })

  return raw as unknown as RazorpayOrder
}

/** Recurring mandate — starts next month because first month was paid via order. */
export async function createRecurringSubscriptionAfterOrder(
  planKey: RazorpayPlanKey,
  customerId: string,
  userId: string,
  orderId: string
) {
  const rz = getRazorpayClient()
  const startAt = Math.floor(addMonths(new Date(), 1).getTime() / 1000)

  const raw = await rz.subscriptions.create({
    plan_id: getRazorpayPlanId(planKey),
    customer_id: customerId,
    customer_notify: 1,
    total_count: 119,
    start_at: startAt,
    notes: {
      userId,
      plan: planKey,
      firstOrderId: orderId,
    },
  } as never)

  return raw as unknown as {
    id: string
    status: string
    current_start?: number
    current_end?: number
    paid_count?: number
  }
}

export async function fetchRazorpayOrder(orderId: string): Promise<RazorpayOrder | null> {
  try {
    const raw = await getRazorpayClient().orders.fetch(orderId)
    return raw as unknown as RazorpayOrder
  } catch {
    return null
  }
}

export async function razorpaySubscriptionExists(subscriptionId: string): Promise<boolean> {
  try {
    await getRazorpayClient().subscriptions.fetch(subscriptionId)
    return true
  } catch {
    return false
  }
}
