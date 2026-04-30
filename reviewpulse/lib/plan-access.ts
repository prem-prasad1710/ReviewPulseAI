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

export function planAllowsReviewAutopsy(plan: string): boolean {
  return plan === 'growth' || plan === 'scale'
}

export function planAllowsStaffTracker(plan: string): boolean {
  return plan === 'growth' || plan === 'scale'
}

export function planAllowsFakeScore(plan: string): boolean {
  return isPaidPlan(plan)
}

export function planAllowsMoodHeatmap(plan: string): boolean {
  return plan === 'growth' || plan === 'scale'
}

export function planAllowsSocialPostFull(plan: string): boolean {
  return plan === 'growth' || plan === 'scale'
}

export function planAllowsMenuInsights(plan: string): boolean {
  return plan === 'scale'
}

export function planAllowsOfflineBridge(plan: string): boolean {
  return isPaidPlan(plan)
}

/** B1 — WhatsApp digest bot (pending, stats, …). Paid plans only. */
export function planAllowsWhatsAppDigestBot(plan: string): boolean {
  return isPaidPlan(plan)
}

/** G4 — CSV export of reviews. */
export function planAllowsDataExport(plan: string): boolean {
  return isPaidPlan(plan)
}

/** C3 — Review velocity / time-series analytics UI. */
export function planAllowsVelocityAnalytics(plan: string): boolean {
  return plan === 'growth' || plan === 'scale' || plan === 'agency'
}
