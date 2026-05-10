/** A2 — lightweight “prediction” from stars + text + sentiment (no extra model calls). */

export type PredictionTier = 'low' | 'medium' | 'high'

export function predictReviewRisk(input: {
  rating: number
  comment: string
  sentimentScore: number
}): { score: number; tier: PredictionTier; signals: string[] } {
  let score = 15
  const signals: string[] = []
  if (input.rating <= 2) {
    score += 42
    signals.push('Very low star rating')
  } else if (input.rating === 3) {
    score += 18
    signals.push('Mixed 3★ rating')
  }
  const low = (input.comment || '').toLowerCase()
  const neg = ['never again', 'worst', 'disgusting', 'rude', 'fake', 'scam', 'refund', 'unhygienic', 'pathetic']
  for (const w of neg) {
    if (low.includes(w)) {
      score += 10
      signals.push(`Strong language (“${w}”)`)
    }
  }
  if (input.sentimentScore < -0.35) {
    score += 18
    signals.push('Model sentiment strongly negative')
  }
  score = Math.min(100, Math.round(score))
  const tier: PredictionTier = score >= 68 ? 'high' : score >= 38 ? 'medium' : 'low'
  return { score, tier, signals: signals.slice(0, 6) }
}
