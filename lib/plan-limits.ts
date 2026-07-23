/**
 * Pure plan limit constants — zero imports, safe to use in 'use client' components.
 * All other plan-related logic lives in lib/plans.ts (server-side).
 */
export const PLAN_LIMITS = {
  free: { locations: 1, repliesPerMonth: 10, price: 0 },
  starter: { locations: 1, repliesPerMonth: 100, price: 999 },
  growth: { locations: 3, repliesPerMonth: 500, price: 2499 },
  scale: { locations: 10, repliesPerMonth: -1, price: 5999 },
  agency: { locations: 20, repliesPerMonth: -1, price: 9999 },
} as const

export type PlanLimits = typeof PLAN_LIMITS
export type PlanKey = keyof typeof PLAN_LIMITS
