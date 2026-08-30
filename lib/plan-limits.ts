/**
 * Pure plan limit constants — zero imports, safe to use in 'use client' components.
 * All other plan-related logic lives in lib/plans.ts (server-side).
 */
export const PLAN_LIMITS = {
  free: { locations: 1, repliesPerMonth: 10, price: 0 },
  starter: { locations: 1, repliesPerMonth: 100, price: 499 },
  growth: { locations: 3, repliesPerMonth: 500, price: 999 },
  scale: { locations: 10, repliesPerMonth: -1, price: 1999 },
  agency: { locations: 20, repliesPerMonth: -1, price: 2999 },
} as const

/** Razorpay add-on for extra agency client locations (not a workspace plan tier). */
export const AGENCY_LOCATION_ADDON_PRICE = 299

export type PlanLimits = typeof PLAN_LIMITS
export type PlanKey = keyof typeof PLAN_LIMITS
