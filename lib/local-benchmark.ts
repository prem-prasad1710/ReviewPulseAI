/** C2 — hyper-local style benchmark vs a simple India GBP baseline (deterministic, no external API). */

export function hyperLocalBenchmark(avgRating: number, reviewCount: number): {
  percentile: number
  vsIndiaAvg: string
  baseline: number
} {
  const baseline = 4.05
  const vs = avgRating - baseline
  const nudge = Math.min(12, Math.floor(reviewCount / 40))
  const percentile = Math.max(
    8,
    Math.min(98, Math.round(52 + vs * 24 + nudge))
  )
  let vsIndiaAvg = 'near typical for busy local listings'
  if (vs >= 0.2) vsIndiaAvg = 'above typical local GBP averages'
  if (vs <= -0.2) vsIndiaAvg = 'below typical — worth a recovery push'
  return { percentile, vsIndiaAvg, baseline }
}
