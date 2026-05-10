/** D3 — crude consistency score vs saved tone examples (word overlap, no embeddings). */

function tokenize(s: string): Set<string> {
  const words = s
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
  return new Set(words)
}

export function brandVoiceConsistencyScore(publishedReplies: string[], toneExamples: string[]): number {
  if (!toneExamples.length || !publishedReplies.length) return 0
  const exTok = new Set<string>()
  for (const ex of toneExamples) {
    for (const w of tokenize(ex)) exTok.add(w)
  }
  if (exTok.size === 0) return 0
  let overlap = 0
  let total = 0
  for (const reply of publishedReplies.slice(-8)) {
    const rt = tokenize(reply)
    for (const w of rt) {
      total += 1
      if (exTok.has(w)) overlap += 1
    }
  }
  if (total === 0) return 0
  const raw = overlap / total
  return Math.min(100, Math.round(raw * 220 + 15))
}
