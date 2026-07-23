import { validatePaymentVerification } from 'razorpay/dist/utils/razorpay-utils'
import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { ensureRazorpayCustomerId } from '@/lib/razorpay-customer'
import {
  createRecurringSubscriptionAfterOrder,
  fetchRazorpayOrder,
} from '@/lib/razorpay-order-checkout'
import { getRazorpayClient, getRazorpayPlanId, type RazorpayPlanKey } from '@/lib/razorpay'
import {
  applyPrimaryPlanToUser,
  resolveWorkspacePlanFromSubscription,
  type RazorpaySubscriptionEntity,
  userOwnsPrimaryRazorpaySubscription,
} from '@/lib/razorpay-subscription-plan-sync'
import Agency from '@/models/Agency'
import Subscription from '@/models/Subscription'
import User from '@/models/User'

const orderBodySchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
})

const subscriptionBodySchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_subscription_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
})

const bodySchema = z.union([orderBodySchema, subscriptionBodySchema])

function isOrderBody(
  body: z.infer<typeof bodySchema>
): body is z.infer<typeof orderBodySchema> {
  return 'razorpay_order_id' in body
}

/**
 * After Checkout success — verify payment, persist plan + subscription.
 * Supports order checkout (full first month) and legacy subscription checkout.
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const secret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!secret) return err('Razorpay is not configured on the server', 500)

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    await connectDB()

    if (isOrderBody(parsed.data)) {
      return completeOrderCheckout(user._id, parsed.data, secret)
    }

    return completeSubscriptionCheckout(user._id, parsed.data, secret)
  } catch (error) {
    console.error('POST /api/subscriptions/confirm failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Could not confirm payment', 500)
  }
}

async function completeOrderCheckout(
  userId: import('mongoose').Types.ObjectId,
  data: z.infer<typeof orderBodySchema>,
  secret: string
) {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = data

  const valid = validatePaymentVerification(
    { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
    razorpay_signature,
    secret
  )
  if (!valid) return err('Invalid payment signature', 400)

  const order = await fetchRazorpayOrder(razorpay_order_id)
  if (!order) return err('Order not found on Razorpay', 404)

  const orderUserId = order.notes?.userId
  const planRaw = order.notes?.plan
  if (orderUserId !== String(userId)) return err('Order does not belong to this account', 403)
  if (!planRaw || !['starter', 'growth', 'scale', 'agency', 'agency_addon'].includes(planRaw)) {
    return err('Invalid plan on order', 400)
  }

  const planKey = planRaw as RazorpayPlanKey

  const existing = await Subscription.findOne({ firstOrderId: razorpay_order_id, userId }).lean()
  if (existing) {
    return ok({ synced: true, subscriptionId: existing.razorpaySubscriptionId })
  }

  const customerId = await ensureRazorpayCustomerId(userId)
  const entity = await createRecurringSubscriptionAfterOrder(planKey, customerId, String(userId), razorpay_order_id)
  const razorpayPlanId = getRazorpayPlanId(planKey)

  if (planKey !== 'agency_addon') {
    await User.findByIdAndUpdate(userId, { $set: { razorpaySubscriptionId: entity.id } })
  }

  const subDoc = await Subscription.create({
    userId,
    razorpaySubscriptionId: entity.id,
    razorpayPlanId,
    plan: planKey,
    status: entity.status as 'created',
    currentStart: new Date((entity.current_start || Math.floor(Date.now() / 1000)) * 1000),
    currentEnd: new Date((entity.current_end || Math.floor(Date.now() / 1000)) * 1000),
    paidCount: (entity.paid_count || 0) + 1,
    firstOrderId: razorpay_order_id,
    firstPaymentId: razorpay_payment_id,
  })

  if (planKey === 'agency_addon') {
    await User.findByIdAndUpdate(userId, { $set: { subscriptionStatus: 'active' } })
    return ok({ synced: true, subscriptionId: entity.id })
  }

  const workspacePlan = resolveWorkspacePlanFromSubscription(subDoc, { plan_id: razorpayPlanId })
  if (!workspacePlan) return err('Could not resolve plan for subscription', 500)

  await applyPrimaryPlanToUser(userId, workspacePlan, entity.id)

  if (planKey === 'agency') {
    await Agency.updateMany({ ownerId: userId }, { $set: { razorpaySubscriptionId: entity.id } })
  }

  return ok({ synced: true, subscriptionId: entity.id })
}

async function completeSubscriptionCheckout(
  userId: import('mongoose').Types.ObjectId,
  data: z.infer<typeof subscriptionBodySchema>,
  secret: string
) {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = data

  const valid = validatePaymentVerification(
    { subscription_id: razorpay_subscription_id, payment_id: razorpay_payment_id },
    razorpay_signature,
    secret
  )
  if (!valid) return err('Invalid payment signature', 400)

  const sub = await Subscription.findOne({
    razorpaySubscriptionId: razorpay_subscription_id,
    userId,
  })
  if (!sub) return err('Subscription not found for this account', 404)

  const rz = getRazorpayClient()
  const entity = (await rz.subscriptions.fetch(razorpay_subscription_id)) as RazorpaySubscriptionEntity

  if (String(entity.status || '').toLowerCase() === 'cancelled') {
    return err('This subscription is cancelled. Use billing to subscribe again.', 409)
  }

  sub.status = entity.status as typeof sub.status
  if (entity.current_start) sub.currentStart = new Date(entity.current_start * 1000)
  if (entity.current_end) sub.currentEnd = new Date(entity.current_end * 1000)
  if (typeof entity.paid_count === 'number') sub.paidCount = entity.paid_count
  await sub.save()

  if (sub.plan === 'agency_addon') {
    await User.findByIdAndUpdate(sub.userId, { $set: { subscriptionStatus: 'active' } })
    return ok({ synced: true })
  }

  const matchesPrimary = await userOwnsPrimaryRazorpaySubscription(String(userId), razorpay_subscription_id)
  if (!matchesPrimary) return err('Subscription does not match this workspace', 403)

  const plan = resolveWorkspacePlanFromSubscription(sub, entity)
  if (!plan) return err('Could not resolve plan for subscription', 500)

  await applyPrimaryPlanToUser(userId, plan, razorpay_subscription_id)
  return ok({ synced: true })
}
