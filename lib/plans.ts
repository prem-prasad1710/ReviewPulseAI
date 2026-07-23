import type { IUserLean } from '@/types'
import { getEffectivePlan } from '@/lib/trial'
import { PLAN_LIMITS } from '@/lib/plan-limits'

export { PLAN_LIMITS }

const AGENCY_BASE_LOCATIONS = PLAN_LIMITS.agency.locations

/** Total location slots for agency plan (base 20 + Razorpay add-on slots). */
export function effectiveAgencyLocationLimit(user: IUserLean): number {
  if (user.plan !== 'agency') return AGENCY_BASE_LOCATIONS
  const add = typeof user.agencyLocationAddons === 'number' ? user.agencyLocationAddons : 0
  return AGENCY_BASE_LOCATIONS + add
}

/** Location cap for any plan (used when enforcing max locations). */
export function effectiveLocationLimit(user: IUserLean): number {
  const plan = getEffectivePlan(user)
  if (plan === 'agency') return effectiveAgencyLocationLimit(user)
  return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS].locations
}

export function canGenerateReply(user: IUserLean): { allowed: boolean; reason?: string } {
  const plan = getEffectivePlan(user)
  const limit = PLAN_LIMITS[plan in PLAN_LIMITS ? plan : 'free'].repliesPerMonth

  if (limit === -1) return { allowed: true }
  if (user.repliesUsedThisMonth >= limit) {
    return {
      allowed: false,
      reason: `Monthly limit of ${limit} replies reached. Upgrade your plan.`,
    }
  }

  return { allowed: true }
}
