import { hyperLocalBenchmark } from '@/lib/local-benchmark'
import { computeReputationScore, letterGrade } from '@/lib/score-compute'

export type OwnerBriefReview = {
  locationId?: string
  rating: number
  sentiment?: string
  status?: string
  comment?: string
  reviewCreatedAt: Date
}

export type OwnerBriefLocation = {
  _id: string
  name: string
  locationSlug?: string | null
  lastSyncedAt?: Date | null
}

export type OwnerBrief = {
  reputationScore: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  percentile: number
  vsIndiaAvg: string
  pendingReplies: number
  lowStarPending: number
  avgRating: number
  responseRate: number
  reviewsThisWeek: number
  reviewsLastWeek: number
  avgRatingThisWeek: number
  avgRatingLastWeek: number
  ratingTrend: 'up' | 'down' | 'flat'
  topActions: string[]
  locations: Array<{
    id: string
    name: string
    slug: string | null
    health: 'excellent' | 'good' | 'attention' | 'critical'
    pending: number
    avgRating: number
    lastSyncedAt: Date | null
  }>
}

function weekBounds(offsetWeeks: number): { start: Date; end: Date } {
  const end = new Date()
  end.setDate(end.getDate() - offsetWeeks * 7)
  const start = new Date(end)
  start.setDate(start.getDate() - 7)
  return { start, end }
}

function locationHealth(pending: number, avg: number, lowStar: number): OwnerBrief['locations'][0]['health'] {
  if (lowStar > 0 || avg < 3.5 || pending > 8) return 'critical'
  if (pending > 3 || avg < 4.0) return 'attention'
  if (pending > 0 || avg < 4.3) return 'good'
  return 'excellent'
}

export function buildOwnerBrief(
  reviews: OwnerBriefReview[],
  locations: OwnerBriefLocation[]
): OwnerBrief {
  const now = Date.now()
  const thisWeek = weekBounds(0)
  const lastWeek = weekBounds(1)

  const inRange = (r: OwnerBriefReview, start: Date, end: Date) => {
    const t = new Date(r.reviewCreatedAt).getTime()
    return t >= start.getTime() && t <= end.getTime()
  }

  const thisWeekReviews = reviews.filter((r) => inRange(r, thisWeek.start, thisWeek.end))
  const lastWeekReviews = reviews.filter((r) => inRange(r, lastWeek.start, lastWeek.end))

  const avg = (arr: OwnerBriefReview[]) =>
    arr.length ? arr.reduce((s, r) => s + r.rating, 0) / arr.length : 0

  const avgRatingThisWeek = avg(thisWeekReviews)
  const avgRatingLastWeek = avg(lastWeekReviews)
  const avgRating = reviews.length ? avg(reviews) : 0

  const replied = reviews.filter((r) => r.status === 'replied').length
  const responseRate = reviews.length ? Math.round((replied / reviews.length) * 100) : 0
  const positive = reviews.filter((r) => r.sentiment === 'positive').length
  const positiveRatio = reviews.length ? positive / reviews.length : 0

  const pendingReplies = reviews.filter((r) => r.status === 'pending' || r.status === 'scheduled').length
  const lowStarPending = reviews.filter(
    (r) => r.rating <= 2 && (r.status === 'pending' || r.status === 'scheduled')
  ).length

  const reputationScore = computeReputationScore({
    averageRating: avgRating,
    replyRate: responseRate / 100,
    positiveRatio,
  })
  const grade = letterGrade(reputationScore)
  const bench = hyperLocalBenchmark(avgRating, reviews.length)

  let ratingTrend: OwnerBrief['ratingTrend'] = 'flat'
  if (thisWeekReviews.length && lastWeekReviews.length) {
    if (avgRatingThisWeek > avgRatingLastWeek + 0.05) ratingTrend = 'up'
    else if (avgRatingThisWeek < avgRatingLastWeek - 0.05) ratingTrend = 'down'
  }

  const topActions: string[] = []
  if (lowStarPending > 0) {
    topActions.push(`Reply to ${lowStarPending} urgent ≤2★ review${lowStarPending === 1 ? '' : 's'} today`)
  } else if (pendingReplies > 0) {
    topActions.push(`Clear ${pendingReplies} pending review${pendingReplies === 1 ? '' : 's'} in your inbox`)
  }
  if (responseRate < 70 && reviews.length >= 5) {
    topActions.push('Raise response rate above 70% — Google rewards fast replies')
  }
  if (ratingTrend === 'down') {
    topActions.push('Rating dipped this week — check negative themes in Analytics')
  }
  if (topActions.length === 0 && reviews.length > 0) {
    topActions.push('Strong week — share your public score badge to attract new customers')
  }
  if (reviews.length === 0) {
    topActions.push('Sync Google reviews to unlock AI replies and WhatsApp alerts')
  }

  const byLocation = new Map<string, OwnerBriefReview[]>()
  for (const loc of locations) {
    byLocation.set(loc._id, [])
  }
  for (const r of reviews) {
    const locId = (r as OwnerBriefReview & { locationId?: string }).locationId
    if (locId && byLocation.has(locId)) {
      byLocation.get(locId)!.push(r)
    }
  }

  const locationBriefs = locations.map((loc) => {
    const locReviews = reviews.filter(
      (r) => String((r as OwnerBriefReview & { locationId?: string }).locationId) === loc._id
    )
    const pending = locReviews.filter((r) => r.status === 'pending' || r.status === 'scheduled').length
    const lowStar = locReviews.filter(
      (r) => r.rating <= 2 && (r.status === 'pending' || r.status === 'scheduled')
    ).length
    const locAvg = locReviews.length ? locReviews.reduce((s, r) => s + r.rating, 0) / locReviews.length : 0
    return {
      id: loc._id,
      name: loc.name,
      slug: loc.locationSlug ?? null,
      health: locationHealth(pending, locAvg, lowStar),
      pending,
      avgRating: locAvg,
      lastSyncedAt: loc.lastSyncedAt ? new Date(loc.lastSyncedAt) : null,
    }
  })

  return {
    reputationScore,
    grade,
    percentile: bench.percentile,
    vsIndiaAvg: bench.vsIndiaAvg,
    pendingReplies,
    lowStarPending,
    avgRating,
    responseRate,
    reviewsThisWeek: thisWeekReviews.length,
    reviewsLastWeek: lastWeekReviews.length,
    avgRatingThisWeek,
    avgRatingLastWeek,
    ratingTrend,
    topActions: topActions.slice(0, 4),
    locations: locationBriefs,
  }
}
