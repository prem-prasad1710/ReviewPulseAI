import type { IUserLean } from '@/types'

export const TRIAL_DAYS = 14
export const TRIAL_PLAN = 'growth' as const

export function isTrialActive(user: Pick<IUserLean, 'trialEndsAt' | 'subscriptionStatus'>): boolean {
  if (user.subscriptionStatus === 'active') return false
  if (!user.trialEndsAt) return false
  return new Date(user.trialEndsAt).getTime() > Date.now()
}

export function trialDaysRemaining(user: Pick<IUserLean, 'trialEndsAt' | 'subscriptionStatus'>): number {
  if (!isTrialActive(user) || !user.trialEndsAt) return 0
  const ms = new Date(user.trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}

/** Plan used for limits and feature gates (trial grants Growth access). */
export function getEffectivePlan(user: IUserLean): IUserLean['plan'] {
  if (user.subscriptionStatus === 'active' && user.plan !== 'free') {
    return user.plan
  }
  if (isTrialActive(user)) return TRIAL_PLAN
  if (user.plan === TRIAL_PLAN && user.subscriptionStatus !== 'active') return 'free'
  return user.plan in { free: 1, starter: 1, growth: 1, scale: 1, agency: 1 } ? user.plan : 'free'
}

/** Downgrade expired trials to free tier. Returns true if user was updated. */
export async function expireTrialIfNeeded(userId: string): Promise<boolean> {
  const { connectDB } = await import('@/lib/mongodb')
  const User = (await import('@/models/User')).default
  await connectDB()
  const user = await User.findById(userId).select('trialEndsAt subscriptionStatus plan').lean()
  if (!user?.trialEndsAt) return false
  if (new Date(user.trialEndsAt).getTime() > Date.now()) return false
  if (user.subscriptionStatus === 'active') return false
  if (user.plan === 'free') return false
  await User.findByIdAndUpdate(userId, { $set: { plan: 'free' } })
  return true
}

export function trialEndsAtFromNow(): Date {
  const d = new Date()
  d.setDate(d.getDate() + TRIAL_DAYS)
  return d
}
