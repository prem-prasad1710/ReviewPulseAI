export interface ScoreInputs {
  averageRating: number
  replyRate: number
  positiveRatio: number
}

export function computeReputationScore(input: ScoreInputs): number {
  const avg = Math.min(5, Math.max(0, input.averageRating))
  const rr = Math.min(1, Math.max(0, input.replyRate))
  const pr = Math.min(1, Math.max(0, input.positiveRatio))
  return Math.round((avg / 5) * 40 + rr * 30 + pr * 30)
}

export function letterGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}
