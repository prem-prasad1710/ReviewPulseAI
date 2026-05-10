import type { Types } from 'mongoose'
import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { ensureRazorpayCustomerId } from '@/lib/razorpay-customer'
import { getRazorpayClient, getRazorpayPlanId, type RazorpayPlanKey } from '@/lib/razorpay'
import { subscriptionCreateLimiter } from '@/lib/rate-limit'
import Agency from '@/models/Agency'
import Subscription from '@/models/Subscription'
import User from '@/models/User'

const bodySchema = z.object({
  plan: z.enum(['starter', 'growth', 'scale', 'agency', 'agency_addon']),
})

export async function POST(request: Request) {
  let userId: Types.ObjectId | null = null
  let createdRazorpayId: string | null = null
  let wroteUserPointer = false

  try {
    const user = await requireAuth()
    userId = user._id
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

    const razorpay = getRazorpayClient()
    const planKey = parsed.data.plan as RazorpayPlanKey
    const razorpayPlanId = getRazorpayPlanId(planKey)

    const customerId = await ensureRazorpayCustomerId(user._id)

    /* Razorpay API accepts customer_id; SDK types omit it — cast for compile. */
    const subscriptionRaw = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      customer_id: customerId,
      customer_notify: 1,
      total_count: 120,
      notes: {
        userId: String(user._id),
        plan: parsed.data.plan,
      },
    } as never)
    const subscription = subscriptionRaw as unknown as {
      id: string
      status: string
      current_start?: number
      current_end?: number
      paid_count?: number
      short_url?: string
    }

    createdRazorpayId = subscription.id

    try {
      if (parsed.data.plan !== 'agency_addon') {
        await User.findByIdAndUpdate(user._id, {
          $set: { razorpaySubscriptionId: subscription.id },
        })
        wroteUserPointer = true
      }

      await Subscription.create({
        userId: user._id,
        razorpaySubscriptionId: subscription.id,
        razorpayPlanId,
        plan: parsed.data.plan,
        status: subscription.status as 'created',
        currentStart: new Date((subscription.current_start || Math.floor(Date.now() / 1000)) * 1000),
        currentEnd: new Date((subscription.current_end || Math.floor(Date.now() / 1000)) * 1000),
        paidCount: subscription.paid_count || 0,
      })

      if (parsed.data.plan === 'agency') {
        await Agency.updateMany({ ownerId: user._id }, { $set: { razorpaySubscriptionId: subscription.id } })
      }
    } catch (dbErr) {
      console.error('Subscription persistence failed after Razorpay create:', dbErr)
      await rollbackSubscription(razorpay, subscription.id, user._id, wroteUserPointer)
      createdRazorpayId = null
      wroteUserPointer = false
      return err('Could not save subscription. Please try again or contact support.', 500)
    }

    let shortUrl = subscription.short_url
    if (!shortUrl && subscription.id) {
      try {
        const fetched = (await razorpay.subscriptions.fetch(subscription.id)) as { short_url?: string }
        shortUrl = fetched.short_url
      } catch {
        /* ignore — modal checkout still works */
      }
    }

    return ok({
      subscriptionId: subscription.id,
      shortUrl,
    })
  } catch (error) {
    if (createdRazorpayId && userId) {
      try {
        await rollbackSubscription(getRazorpayClient(), createdRazorpayId, userId, wroteUserPointer)
      } catch (rollbackErr) {
        console.error('Subscription rollback failed:', rollbackErr)
      }
    }
    console.error('POST /api/subscriptions/create failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    if (error instanceof Error && error.message === 'USER_EMAIL_REQUIRED') {
      return err('Add an email to your account before subscribing.', 400)
    }
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') return err('Account not found', 404)
    if (error instanceof Error && error.message.startsWith('Missing Razorpay credentials')) {
      return err(
        'Razorpay is not configured on the server. In your host (e.g. Vercel → Environment Variables) add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from Razorpay Dashboard → API Keys (Test mode is fine—use rzp_test_… + test secret until you go live). Set NEXT_PUBLIC_RAZORPAY_KEY_ID to the same Key ID for Checkout. Add RAZORPAY_PLAN_* plan ids from Test mode plans, RAZORPAY_WEBHOOK_SECRET if you use webhooks, then redeploy.',
        500
      )
    }
    if (error instanceof Error && error.message.startsWith('Missing Razorpay plan id')) {
      return err(error.message, 503)
    }
    return err('Failed to create subscription', 500)
  }
}

async function rollbackSubscription(
  razorpay: ReturnType<typeof getRazorpayClient>,
  subscriptionId: string,
  userId: Types.ObjectId,
  unsetUserPointer: boolean
) {
  try {
    await razorpay.subscriptions.cancel(subscriptionId)
  } catch {
    /* already cancelled / terminal */
  }
  await Subscription.deleteOne({ razorpaySubscriptionId: subscriptionId })
  if (unsetUserPointer) {
    await User.findByIdAndUpdate(userId, { $unset: { razorpaySubscriptionId: 1 } })
  }
  await Agency.updateMany({ ownerId: userId, razorpaySubscriptionId: subscriptionId }, {
    $unset: { razorpaySubscriptionId: 1 },
  })
}
