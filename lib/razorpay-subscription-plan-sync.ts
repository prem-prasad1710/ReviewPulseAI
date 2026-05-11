import type { Types } from 'mongoose'
import Agency from '@/models/Agency'
import User from '@/models/User'

const PLAN_BY_ID: Record<string, 'starter' | 'growth' | 'scale' | 'agency'> = {
  [process.env.RAZORPAY_PLAN_STARTER || '']: 'starter',
  [process.env.RAZORPAY_PLAN_GROWTH || '']: 'growth',
  [process.env.RAZORPAY_PLAN_SCALE || '']: 'scale',
  [process.env.RAZORPAY_PLAN_AGENCY || '']: 'agency',
}

export type RazorpaySubscriptionEntity = {
  id: string
  status: string
  plan_id: string
  current_start?: number
  current_end?: number
  paid_count?: number
}

export function resolveWorkspacePlanFromSubscription(
  sub: { razorpayPlanId: string; plan: string },
  entity?: Pick<RazorpaySubscriptionEntity, 'plan_id'> | null
): 'starter' | 'growth' | 'scale' | 'agency' | undefined {
  const planFromRazorpay = PLAN_BY_ID[(entity?.plan_id || sub.razorpayPlanId) ?? '']
  return planFromRazorpay || (sub.plan !== 'agency_addon' ? (sub.plan as 'starter' | 'growth' | 'scale' | 'agency') : undefined)
}

export async function userOwnsPrimaryRazorpaySubscription(
  userId: string,
  subscriptionId: string
): Promise<boolean> {
  const u = await User.findById(userId).select('razorpaySubscriptionId').lean()
  return Boolean(u?.razorpaySubscriptionId && u.razorpaySubscriptionId === subscriptionId)
}

/** Idempotent: set workspace plan + quota reset for a paid primary subscription (not agency_addon). */
export async function applyPrimaryPlanToUser(
  userId: Types.ObjectId,
  plan: 'starter' | 'growth' | 'scale' | 'agency',
  subscriptionId: string
): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    $set: {
      subscriptionStatus: 'active',
      plan,
      repliesUsedThisMonth: 0,
      repliesResetAt: new Date(),
    },
  })
  if (plan === 'agency') {
    await Agency.updateMany({ ownerId: userId }, { $set: { razorpaySubscriptionId: subscriptionId } })
  }
}
