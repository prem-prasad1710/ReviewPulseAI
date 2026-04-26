import type { Plan } from '@/types'

export type ExtendedPlan = Plan | 'agency'

export function planAllowsToneTrainer(plan: string): boolean {
  return plan === 'growth' || plan === 'scale'
}

export function planAllowsCompetitorSpy(plan: string): boolean {
  return plan === 'scale'
}

export function planAllowsWhatsApp(plan: string): boolean {
  return plan === 'starter' || plan === 'growth' || plan === 'scale' || plan === 'agency'
}

export function planAllowsBooster(plan: string): boolean {
  return plan === 'starter' || plan === 'growth' || plan === 'scale' || plan === 'agency'
}

export function planAllowsKeywordAlerts(plan: string): boolean {
  return plan === 'growth' || plan === 'scale'
}

export function planAllowsReplyScheduler(plan: string): boolean {
  return plan === 'growth' || plan === 'scale'
}

export function planAllowsMonthlyPdfAuto(plan: string): boolean {
  return plan === 'scale'
}

export function competitorLimitForPlan(plan: string): number {
  if (plan === 'scale') return 5
  if (plan === 'growth') return 3
  return 0
}

export function isPaidPlan(plan: string): boolean {
  return plan !== 'free'
}
