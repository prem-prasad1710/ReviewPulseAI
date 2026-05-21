/** In-process fallback when Redis/Upstash is not configured (per server instance). */
const timestamps = new Map<string, number[]>()

export function memorySlidingWindowAllow(key: string, maxHits: number, windowMs: number): boolean {
  const now = Date.now()
  const prev = timestamps.get(key) ?? []
  const fresh = prev.filter((t) => now - t < windowMs)
  if (fresh.length >= maxHits) {
    timestamps.set(key, fresh)
    return false
  }
  fresh.push(now)
  timestamps.set(key, fresh)
  return true
}
