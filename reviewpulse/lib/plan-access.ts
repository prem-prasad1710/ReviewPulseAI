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

/** A3 — Competitor battle card PDF. */
export function planAllowsBattleCardPdf(plan: string): boolean {
  return plan === 'growth' || plan === 'scale' || plan === 'agency'
}

/** C6 — Investor one-pager PDF. */
export function planAllowsInvestorReportPdf(plan: string): boolean {
  return plan === 'scale' || plan === 'agency'
}

/** F4 — Customer survey engine. */
export function planAllowsSurveys(plan: string): boolean {
  return plan === 'growth' || plan === 'scale' || plan === 'agency'
}

/** G1 — Public REST API key. */
export function planAllowsPublicRestApi(plan: string): boolean {
  return plan === 'growth' || plan === 'scale' || plan === 'agency'
}

/** A2 / A5 / F2 / C2 extras bundled for Growth+. */
export function planAllowsV2IntelligencePack(plan: string): boolean {
  return plan === 'growth' || plan === 'scale' || plan === 'agency'
}
