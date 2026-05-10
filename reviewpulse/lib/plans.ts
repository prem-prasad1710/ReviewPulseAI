import type { IUserLean } from '@/types'

export const PLAN_LIMITS = {
  free: { locations: 1, repliesPerMonth: 10, price: 0 },
  starter: { locations: 1, repliesPerMonth: 100, price: 999 },
  growth: { locations: 3, repliesPerMonth: 500, price: 2499 },
  scale: { locations: 10, repliesPerMonth: -1, price: 5999 },
  agency: { locations: 20, repliesPerMonth: -1, price: 9999 },
} as const

const AGENCY_BASE_LOCATIONS = PLAN_LIMITS.agency.locations

/** Total location slots for agency plan (base 20 + Razorpay add-on slots). */
export function effectiveAgencyLocationLimit(user: IUserLean): number {
  if (user.plan !== 'agency') return AGENCY_BASE_LOCATIONS
  const add = typeof user.agencyLocationAddons === 'number' ? user.agencyLocationAddons : 0
  return AGENCY_BASE_LOCATIONS + add
}

/** Location cap for any plan (used when enforcing max locations). */
export function effectiveLocationLimit(user: IUserLean): number {
  const plan = user.plan in PLAN_LIMITS ? user.plan : 'free'
  if (plan === 'agency') return effectiveAgencyLocationLimit(user)
  return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS].locations
}

export function canGenerateReply(user: IUserLean): { allowed: boolean; reason?: string } {
  const plan = user.plan in PLAN_LIMITS ? user.plan : 'free'
  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS].repliesPerMonth

  if (limit === -1) return { allowed: true }
  if (user.repliesUsedThisMonth >= limit) {
    return {
      allowed: false,
      reason: `Monthly limit of ${limit} replies reached. Upgrade your plan.`,
    }
  }

  return { allowed: true }
}
