import { validatePaymentVerification } from 'razorpay/dist/utils/razorpay-utils'
import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { getRazorpayClient } from '@/lib/razorpay'
import {
  applyPrimaryPlanToUser,
  resolveWorkspacePlanFromSubscription,
  type RazorpaySubscriptionEntity,
  userOwnsPrimaryRazorpaySubscription,
} from '@/lib/razorpay-subscription-plan-sync'
import Subscription from '@/models/Subscription'
import User from '@/models/User'

const bodySchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_subscription_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
})

/**
 * After Checkout success, Razorpay calls the browser handler before webhooks may arrive.
 * Verify the payment signature server-side and persist plan + subscription row so the DB
 * matches reality even if webhooks are delayed or misconfigured.
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const secret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!secret) return err('Razorpay is not configured on the server', 500)

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = parsed.data

    const valid = validatePaymentVerification(
      {
        subscription_id: razorpay_subscription_id,
        payment_id: razorpay_payment_id,
      },
      razorpay_signature,
      secret
    )
    if (!valid) return err('Invalid payment signature', 400)

    await connectDB()

    const sub = await Subscription.findOne({
      razorpaySubscriptionId: razorpay_subscription_id,
      userId: user._id,
    })
    if (!sub) return err('Subscription not found for this account', 404)

    const rz = getRazorpayClient()
    const entity = (await rz.subscriptions.fetch(razorpay_subscription_id)) as RazorpaySubscriptionEntity

    sub.status = entity.status as typeof sub.status
    if (entity.current_start) sub.currentStart = new Date(entity.current_start * 1000)
    if (entity.current_end) sub.currentEnd = new Date(entity.current_end * 1000)
    if (typeof entity.paid_count === 'number') sub.paidCount = entity.paid_count
    await sub.save()

    if (sub.plan === 'agency_addon') {
      /* Seat increment is handled by POST /api/webhooks/razorpay (subscription.activated). */
      await User.findByIdAndUpdate(sub.userId, { $set: { subscriptionStatus: 'active' } })
      return ok({ synced: true })
    }

    const matchesPrimary = await userOwnsPrimaryRazorpaySubscription(String(user._id), razorpay_subscription_id)
    if (!matchesPrimary) return err('Subscription does not match this workspace', 403)

    const plan = resolveWorkspacePlanFromSubscription(sub, entity)
    if (!plan) return err('Could not resolve plan for subscription', 500)

    await applyPrimaryPlanToUser(user._id, plan, razorpay_subscription_id)
    return ok({ synced: true })
  } catch (error) {
    console.error('POST /api/subscriptions/confirm failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Could not confirm subscription', 500)
  }
}
