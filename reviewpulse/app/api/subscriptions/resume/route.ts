import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { getRazorpayClient } from '@/lib/razorpay'
import Subscription from '@/models/Subscription'

const bodySchema = z.object({
  subscriptionId: z.string().min(1),
})

/**
 * Validates that a subscription belongs to the signed-in user and returns
 * checkout metadata (e.g. mandate short_url) for incomplete authorizations.
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    await connectDB()

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    const sub = await Subscription.findOne({
      userId: user._id,
      razorpaySubscriptionId: parsed.data.subscriptionId,
    }).lean()

    if (!sub) return err('Subscription not found', 404)

    let shortUrl: string | undefined
    try {
      const rz = getRazorpayClient()
      const live = (await rz.subscriptions.fetch(sub.razorpaySubscriptionId)) as { short_url?: string }
      shortUrl = live.short_url
    } catch {
      /* still allow opening Checkout with subscription_id */
    }

    return ok({ subscriptionId: sub.razorpaySubscriptionId, shortUrl })
  } catch (error) {
    console.error('POST /api/subscriptions/resume failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    if (error instanceof Error && error.message.startsWith('Missing Razorpay credentials')) {
      return err(
        'Razorpay is not configured on the server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on your deployment, plus NEXT_PUBLIC_RAZORPAY_KEY_ID for checkout, then redeploy.',
        500
      )
    }
    return err('Failed to resume checkout', 500)
  }
}
