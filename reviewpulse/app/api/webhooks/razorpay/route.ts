import { err, ok } from '@/lib/api'
import { connectDB } from '@/lib/mongodb'
import { getRazorpayClient, verifyRazorpayWebhookSignature } from '@/lib/razorpay'
import {
  applyPrimaryPlanToUser,
  resolveWorkspacePlanFromSubscription,
} from '@/lib/razorpay-subscription-plan-sync'
import Agency from '@/models/Agency'
import Subscription from '@/models/Subscription'
import User from '@/models/User'

type SubscriptionEntity = {
  id: string
  status: string
  plan_id: string
  current_start?: number
  current_end?: number
  paid_count?: number
}

type RazorpayWebhookBody = {
  event: string
  payload?: {
    subscription?: { entity?: SubscriptionEntity }
    payment?: { entity?: { subscription_id?: string } }
  }
}

function subscriptionIdFromPayload(payload: RazorpayWebhookBody['payload']): string | null {
  const fromSub = payload?.subscription?.entity?.id
  const fromPayment = payload?.payment?.entity?.subscription_id
  const id = fromSub || fromPayment
  return id && typeof id === 'string' ? id : null
}

async function userOwnsThisSubscription(userId: string, subscriptionId: string): Promise<boolean> {
  const u = await User.findById(userId).select('razorpaySubscriptionId').lean()
  return Boolean(u?.razorpaySubscriptionId && u.razorpaySubscriptionId === subscriptionId)
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-razorpay-signature')
    if (!signature) return err('Missing signature', 400)

    const rawBody = await request.text()
    const verified = verifyRazorpayWebhookSignature(rawBody, signature)
    if (!verified) return err('Invalid signature', 401)

    const payload = JSON.parse(rawBody) as RazorpayWebhookBody

    const subscriptionId = subscriptionIdFromPayload(payload.payload)
    if (!subscriptionId) return ok({ received: true })

    let entity = payload.payload?.subscription?.entity

    await connectDB()

    const sub = await Subscription.findOne({ razorpaySubscriptionId: subscriptionId })
    if (!sub) return ok({ received: true })

    if (!entity) {
      try {
        const rz = getRazorpayClient()
        entity = (await rz.subscriptions.fetch(subscriptionId)) as SubscriptionEntity
      } catch {
        if (payload.event === 'payment.failed') {
          entity = { id: subscriptionId, status: sub.status, plan_id: sub.razorpayPlanId }
        }
      }
    }

    if (entity) {
      sub.status = entity.status as typeof sub.status
      if (entity.current_start) sub.currentStart = new Date(entity.current_start * 1000)
      if (entity.current_end) sub.currentEnd = new Date(entity.current_end * 1000)
      if (typeof entity.paid_count === 'number') sub.paidCount = entity.paid_count
      await sub.save()
    }

    const plan = resolveWorkspacePlanFromSubscription(sub, entity)

    if (sub.plan === 'agency_addon') {
      if (payload.event === 'subscription.activated') {
        await User.findByIdAndUpdate(sub.userId, {
          $inc: { agencyLocationAddons: 1 },
          $set: { subscriptionStatus: 'active' },
        })
      }
      if (payload.event === 'subscription.charged' || payload.event === 'payment.captured') {
        await User.findByIdAndUpdate(sub.userId, {
          $set: { subscriptionStatus: 'active' },
        })
      }
      if (payload.event === 'subscription.cancelled') {
        const u = await User.findById(sub.userId).select('agencyLocationAddons').lean()
        const next = Math.max(0, (u?.agencyLocationAddons ?? 0) - 1)
        await User.findByIdAndUpdate(sub.userId, { $set: { agencyLocationAddons: next } })
      }
      /* Do not mark the whole workspace past_due when an add-on mandate fails. */
      return ok({ received: true })
    }

    const matchesPrimary = await userOwnsThisSubscription(String(sub.userId), subscriptionId)

    const primaryPaidEvents = new Set([
      'subscription.activated',
      'subscription.charged',
      'payment.captured',
    ])

    if (primaryPaidEvents.has(payload.event) && plan && matchesPrimary) {
      await applyPrimaryPlanToUser(sub.userId, plan, subscriptionId)
    }

    if (payload.event === 'subscription.cancelled' && matchesPrimary) {
      await User.findByIdAndUpdate(sub.userId, {
        $set: { subscriptionStatus: 'cancelled', plan: 'free', agencyLocationAddons: 0 },
      })
      await Agency.updateMany({ ownerId: sub.userId }, { $unset: { razorpaySubscriptionId: 1 } })
    }

    if (payload.event === 'payment.failed' && matchesPrimary) {
      await User.findByIdAndUpdate(sub.userId, {
        $set: { subscriptionStatus: 'past_due' },
      })
    }

    return ok({ received: true })
  } catch (error) {
    console.error('POST /api/webhooks/razorpay failed:', error)
    return err('Webhook processing failed', 500)
  }
}
