import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { assertRazorpayKeysMatch, cleanupStalePendingSubscriptions } from '@/lib/razorpay-checkout-cleanup'
import { createFirstMonthOrder, razorpaySubscriptionExists } from '@/lib/razorpay-order-checkout'
import { getRazorpayPlanId, type RazorpayPlanKey } from '@/lib/razorpay'
import { assertRazorpayPlanAmount } from '@/lib/razorpay-plan-validation'
import { RAZORPAY_PLAN_CHECKOUT_NAMES } from '@/lib/razorpay-plan-names'
import { subscriptionCreateLimiter } from '@/lib/rate-limit'
import Subscription from '@/models/Subscription'
import User from '@/models/User'

const bodySchema = z.object({
  plan: z.enum(['starter', 'growth', 'scale', 'agency', 'agency_addon']),
})

export async function POST(request: Request) {
  try {
    assertRazorpayKeysMatch()

    const user = await requireAuth()
    await connectDB()

    if (subscriptionCreateLimiter) {
      const identifier = `sub-create:${String(user._id)}`
      const { success } = await subscriptionCreateLimiter.limit(identifier)
      if (!success) return err('Too many checkout attempts. Try again later.', 429)
    }

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    if (parsed.data.plan === 'agency_addon' && (user.plan as string) !== 'agency') {
      return err('Agency location add-on requires an active Agency plan.', 403)
    }

    const planKey = parsed.data.plan as RazorpayPlanKey
    const razorpayPlanId = getRazorpayPlanId(planKey)
    await assertRazorpayPlanAmount(planKey, razorpayPlanId)

    const activeSub = await Subscription.findOne({
      userId: user._id,
      status: { $in: ['active', 'authenticated'] },
      plan: planKey,
    }).lean()

    if (activeSub && planKey !== 'agency_addon') {
      return err('You already have an active subscription for this plan. Check Settings → Billing.', 409)
    }

    await cleanupStalePendingSubscriptions(user._id)

    const u = await User.findById(user._id).select('razorpaySubscriptionId').lean()
    if (u?.razorpaySubscriptionId) {
      const exists = await razorpaySubscriptionExists(u.razorpaySubscriptionId)
      if (!exists) {
        await User.findByIdAndUpdate(user._id, { $unset: { razorpaySubscriptionId: 1 } })
      }
    }

    const order = await createFirstMonthOrder(String(user._id), planKey)

    return ok({
      checkout: 'order' as const,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      plan: planKey,
      displayName: RAZORPAY_PLAN_CHECKOUT_NAMES[planKey],
    })
  } catch (error) {
    console.error('POST /api/subscriptions/create failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    if (error instanceof Error && error.message.includes('RAZORPAY_KEY_ID and NEXT_PUBLIC')) {
      return err(error.message, 500)
    }
    if (error instanceof Error && error.message.startsWith('Missing Razorpay credentials')) {
      return err(
        'Razorpay is not configured. Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and NEXT_PUBLIC_RAZORPAY_KEY_ID (same Key ID) in Vercel, then redeploy.',
        500
      )
    }
    if (error instanceof Error && error.message.startsWith('Missing Razorpay plan id')) {
      return err(error.message, 503)
    }
    if (error instanceof Error && error.message.startsWith('Razorpay plan mismatch')) {
      return err(error.message, 502)
    }
    if (error instanceof Error && error.message.includes('Could not read amount for Razorpay plan')) {
      return err(error.message, 502)
    }
    return err('Failed to start checkout', 500)
  }
}
