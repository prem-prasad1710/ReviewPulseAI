import type { IUserLean } from '@/types'

export const PLAN_LIMITS = {
  free: { locations: 1, repliesPerMonth: 10, price: 0 },
  starter: { locations: 1, repliesPerMonth: 100, price: 999 },
  growth: { locations: 3, repliesPerMonth: 500, price: 2499 },
  scale: { locations: 10, repliesPerMonth: -1, price: 5999 },
} as const

export function canGenerateReply(user: IUserLean): { allowed: boolean; reason?: string } {
  const limit = PLAN_LIMITS[user.plan].repliesPerMonth

  if (limit === -1) return { allowed: true }
  if (user.repliesUsedThisMonth >= limit) {
    return {
      allowed: false,
      reason: `Monthly limit of ${limit} replies reached. Upgrade your plan.`,
    }
  }

  return { allowed: true }
}
