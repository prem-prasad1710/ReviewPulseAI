/** Lightweight “why customers leave” buckets — no AI cost. */
export const NEGATIVE_THEME_BUCKETS = [
  { id: 'wait_time', label: 'Waiting / queue', patterns: [/wait|queue|delay|slow service|late|time/i] },
  { id: 'staff', label: 'Staff attitude', patterns: [/rude|staff|manager|unprofessional|ignored|arrogant/i] },
  { id: 'hygiene', label: 'Hygiene / cleanliness', patterns: [/dirty|hygiene|clean|smell|roach|insect|hair/i] },
  { id: 'pricing', label: 'Pricing / billing', patterns: [/price|expensive|overcharged|bill|refund|payment|upi/i] },
  { id: 'food_quality', label: 'Taste / food quality', patterns: [/cold|bland|stale|burnt|taste|undercooked|soggy/i] },
  { id: 'delivery', label: 'Packaging / delivery', patterns: [/delivery|packaging|spill|leak|zomato|swiggy|parcel/i] },
] as const

export function bucketNegativeReviewThemes(comments: string[]): { id: string; label: string; count: number }[] {
  const counts = new Map<string, { label: string; count: number }>()
  for (const b of NEGATIVE_THEME_BUCKETS) {
    counts.set(b.id, { label: b.label, count: 0 })
  }
  const otherKey = 'other'
  counts.set(otherKey, { label: 'Other / mixed', count: 0 })

  for (const raw of comments) {
    const c = raw.trim()
    if (c.length < 4) continue
    let hit = false
    for (const b of NEGATIVE_THEME_BUCKETS) {
      if (b.patterns.some((re) => re.test(c))) {
        const row = counts.get(b.id)!
        row.count++
        hit = true
        break
      }
    }
    if (!hit) counts.get(otherKey)!.count++
  }

  return [...counts.entries()]
    .map(([id, v]) => ({ id, label: v.label, count: v.count }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
}
