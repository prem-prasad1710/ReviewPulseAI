/**
 * Business Health Score — composite 0–100 score for a business owner's review operations.
 *
 * Dimensions (total 100 pts):
 *   1. Average rating quality   — 30 pts
 *   2. Response rate            — 25 pts
 *   3. No recent crises         — 20 pts
 *   4. Review velocity (active) — 15 pts
 *   5. Fake review risk         — 10 pts
 */

export type HealthDimension = {
  label: string
  score: number
  maxScore: number
  tip: string
}

export type BusinessHealthScoreResult = {
  totalScore: number            // 0–100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
  label: string                 // "Excellent" | "Good" | "Needs attention" | etc.
  trend: 'up' | 'down' | 'flat'
  dimensions: HealthDimension[]
  primaryTip: string
}

export type HealthScoreInput = {
  totalReviews: number
  avgRating: number           // overall avg (1–5)
  repliedCount: number        // total replied
  pendingCount: number        // currently pending
  crisisLast30Days: number    // ReviewAlert type=crisis in last 30 days
  reviewsLast7Days: number    // new reviews in last 7 days
  highFakeScoreCount: number  // reviews with fakeScore >= 70
  /** Previous week score for trend comparison (optional) */
  previousScore?: number
}

export function computeBusinessHealthScore(input: HealthScoreInput): BusinessHealthScoreResult {
  const {
    totalReviews,
    avgRating,
    repliedCount,
    pendingCount,
    crisisLast30Days,
    reviewsLast7Days,
    highFakeScoreCount,
    previousScore,
  } = input

  const dimensions: HealthDimension[] = []

  // 1. Average rating (0–30 pts)
  let ratingScore = 0
  if (totalReviews > 0) {
    // Scale: 1★ = 0, 3★ = 15, 4★ = 22, 4.5★ = 27, 5★ = 30
    ratingScore = Math.round(Math.max(0, (avgRating - 1) / 4) * 30)
  }
  dimensions.push({
    label: 'Average rating',
    score: ratingScore,
    maxScore: 30,
    tip:
      ratingScore >= 25
        ? 'Exceptional rating — keep replying to maintain it'
        : ratingScore >= 18
          ? 'Good rating — target 4.5+ by addressing recurring issues'
          : 'Rating needs work — identify top complaint themes and fix them',
  })

  // 2. Response rate (0–25 pts)
  const totalAnswerable = repliedCount + pendingCount
  const responseRate = totalAnswerable > 0 ? repliedCount / totalAnswerable : 0
  const responseScore = Math.round(responseRate * 25)
  dimensions.push({
    label: 'Response rate',
    score: responseScore,
    maxScore: 25,
    tip:
      responseRate >= 0.9
        ? 'Outstanding response rate'
        : responseRate >= 0.7
          ? `Reply to ${pendingCount} pending review${pendingCount !== 1 ? 's' : ''} to reach 90%`
          : `${pendingCount} reviews waiting — replying within 24h boosts Google ranking`,
  })

  // 3. Crisis-free (0–20 pts)
  const crisisScore =
    crisisLast30Days === 0
      ? 20
      : crisisLast30Days <= 2
        ? 12
        : crisisLast30Days <= 5
          ? 6
          : 0
  dimensions.push({
    label: 'Crisis-free score',
    score: crisisScore,
    maxScore: 20,
    tip:
      crisisLast30Days === 0
        ? 'No crisis keywords in 30 days — excellent!'
        : `${crisisLast30Days} crisis alert${crisisLast30Days > 1 ? 's' : ''} in 30 days — review your crisis keywords and reply promptly`,
  })

  // 4. Review velocity (0–15 pts)
  // Active business = getting reviews regularly
  const velocityScore =
    reviewsLast7Days >= 5
      ? 15
      : reviewsLast7Days >= 2
        ? 10
        : reviewsLast7Days >= 1
          ? 6
          : totalReviews > 0
            ? 3
            : 0
  dimensions.push({
    label: 'Review activity',
    score: velocityScore,
    maxScore: 15,
    tip:
      reviewsLast7Days >= 5
        ? 'High review velocity — great organic visibility'
        : reviewsLast7Days >= 1
          ? 'Moderate activity — use the QR booster to get more reviews'
          : 'No new reviews this week — share your review link with customers',
  })

  // 5. Authenticity / fake risk (0–10 pts)
  const fakeScore =
    highFakeScoreCount === 0
      ? 10
      : highFakeScoreCount <= 2
        ? 6
        : highFakeScoreCount <= 5
          ? 3
          : 0
  dimensions.push({
    label: 'Authenticity health',
    score: fakeScore,
    maxScore: 10,
    tip:
      highFakeScoreCount === 0
        ? 'No suspicious reviews flagged'
        : `${highFakeScoreCount} review${highFakeScoreCount > 1 ? 's' : ''} flagged as potentially inauthentic — report via Google if confirmed`,
  })

  const totalScore = dimensions.reduce((s, d) => s + d.score, 0)

  const grade: BusinessHealthScoreResult['grade'] =
    totalScore >= 92 ? 'A+' :
    totalScore >= 80 ? 'A' :
    totalScore >= 65 ? 'B' :
    totalScore >= 50 ? 'C' :
    totalScore >= 35 ? 'D' : 'F'

  const label =
    grade === 'A+' ? 'Outstanding' :
    grade === 'A' ? 'Excellent' :
    grade === 'B' ? 'Good' :
    grade === 'C' ? 'Needs attention' :
    grade === 'D' ? 'At risk' : 'Critical'

  const trend: BusinessHealthScoreResult['trend'] =
    previousScore === undefined
      ? 'flat'
      : totalScore > previousScore + 2
        ? 'up'
        : totalScore < previousScore - 2
          ? 'down'
          : 'flat'

  // Worst dimension = primary tip
  const worstDim = [...dimensions].sort((a, b) => a.score / a.maxScore - b.score / b.maxScore)[0]
  const primaryTip = worstDim.tip

  return { totalScore, grade, label, trend, dimensions, primaryTip }
}
