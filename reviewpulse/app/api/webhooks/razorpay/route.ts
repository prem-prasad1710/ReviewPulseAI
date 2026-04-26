import { err, ok } from '@/lib/api'
import { connectDB } from '@/lib/mongodb'
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay'
import Subscription from '@/models/Subscription'
import User from '@/models/User'

const PLAN_BY_ID: Record<string, 'starter' | 'growth' | 'scale'> = {
  [process.env.RAZORPAY_PLAN_STARTER || '']: 'starter',
  [process.env.RAZORPAY_PLAN_GROWTH || '']: 'growth',
  [process.env.RAZORPAY_PLAN_SCALE || '']: 'scale',
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-razorpay-signature')
    if (!signature) return err('Missing signature', 400)

    const rawBody = await request.text()
    const verified = verifyRazorpayWebhookSignature(rawBody, signature)
    if (!verified) return err('Invalid signature', 401)

    const payload = JSON.parse(rawBody) as {
      event: string
      payload?: {
        subscription?: { entity?: { id: string; status: string; plan_id: string; current_start?: number; current_end?: number; paid_count?: number } }
      }
    }

    const entity = payload.payload?.subscription?.entity
    if (!entity) return ok({ received: true })

    await connectDB()

    const sub = await Subscription.findOne({ razorpaySubscriptionId: entity.id })
    if (!sub) return ok({ received: true })

    sub.status = entity.status as typeof sub.status
    if (entity.current_start) sub.currentStart = new Date(entity.current_start * 1000)
    if (entity.current_end) sub.currentEnd = new Date(entity.current_end * 1000)
    if (typeof entity.paid_count === 'number') sub.paidCount = entity.paid_count
    await sub.save()

    const plan = PLAN_BY_ID[entity.plan_id] || sub.plan

    if (payload.event === 'subscription.activated') {
      await User.findByIdAndUpdate(sub.userId, {
        $set: { plan, subscriptionStatus: 'active' },
      })
    }

    if (payload.event === 'subscription.charged') {
      await User.findByIdAndUpdate(sub.userId, {
        $set: { subscriptionStatus: 'active', repliesUsedThisMonth: 0, repliesResetAt: new Date() },
      })
    }

    if (payload.event === 'subscription.cancelled') {
      await User.findByIdAndUpdate(sub.userId, {
        $set: { subscriptionStatus: 'cancelled', plan: 'free' },
      })
    }

    if (payload.event === 'payment.failed') {
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
