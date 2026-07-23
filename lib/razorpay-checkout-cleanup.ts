import type { Types } from 'mongoose'
import { getRazorpayClient } from '@/lib/razorpay'
import Agency from '@/models/Agency'
import Subscription from '@/models/Subscription'
import User from '@/models/User'

/** Drop stale pending subscriptions so checkout never reuses invalid Razorpay ids. */
export async function cleanupStalePendingSubscriptions(
  userId: Types.ObjectId,
  options?: { exceptSubscriptionId?: string }
) {
  const rz = getRazorpayClient()
  const pending = await Subscription.find({
    userId,
    status: { $in: ['created', 'authenticated'] },
    ...(options?.exceptSubscriptionId
      ? { razorpaySubscriptionId: { $ne: options.exceptSubscriptionId } }
      : {}),
  }).lean()

  for (const sub of pending) {
    try {
      await rz.subscriptions.cancel(sub.razorpaySubscriptionId)
    } catch {
      /* already cancelled or missing on Razorpay */
    }
    await Subscription.deleteOne({ _id: sub._id })
  }

  if (pending.length > 0) {
    await User.findByIdAndUpdate(userId, { $unset: { razorpaySubscriptionId: 1 } })
    await Agency.updateMany({ ownerId: userId }, { $unset: { razorpaySubscriptionId: 1 } })
  }
}

export function assertRazorpayKeysMatch(): void {
  const server = (process.env.RAZORPAY_KEY_ID || '').trim().replace(/^["']|["']$/g, '')
  const pub = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').trim().replace(/^["']|["']$/g, '')
  if (server && pub && server !== pub) {
    throw new Error(
      'RAZORPAY_KEY_ID and NEXT_PUBLIC_RAZORPAY_KEY_ID must be identical. Checkout uses the public key; subscriptions are created with the server key.'
    )
  }
}
