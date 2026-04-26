import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { getRazorpayClient, getRazorpayPlanId } from '@/lib/razorpay'
import Subscription from '@/models/Subscription'
import User from '@/models/User'

const bodySchema = z.object({
  plan: z.enum(['starter', 'growth', 'scale']),
})

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    await connectDB()

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    const razorpay = getRazorpayClient()
    const razorpayPlanId = getRazorpayPlanId(parsed.data.plan)

    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      customer_notify: 1,
      total_count: 120,
      notes: {
        userId: String(user._id),
        plan: parsed.data.plan,
      },
    })

    await Subscription.create({
      userId: user._id,
      razorpaySubscriptionId: subscription.id,
      razorpayPlanId,
      plan: parsed.data.plan,
      status: subscription.status,
      currentStart: new Date((subscription.current_start || Math.floor(Date.now() / 1000)) * 1000),
      currentEnd: new Date((subscription.current_end || Math.floor(Date.now() / 1000)) * 1000),
      paidCount: subscription.paid_count || 0,
    })

    await User.findByIdAndUpdate(user._id, {
      $set: {
        razorpaySubscriptionId: subscription.id,
      },
    })

    return ok({ subscriptionId: subscription.id })
  } catch (error) {
    console.error('POST /api/subscriptions/create failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    if (error instanceof Error && error.message === 'Missing Razorpay credentials') {
      return err('Razorpay is not configured', 500)
    }
    return err('Failed to create subscription', 500)
  }
}
