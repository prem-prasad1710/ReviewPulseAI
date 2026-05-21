import { memorySlidingWindowAllow } from '@/lib/memory-sliding-window'
import {
  competitorPlacesUserLimiter,
  googlePlacesGlobalLimiter,
  googleStaticMapUserLimiter,
  googleTranslateGlobalLimiter,
  googleTranslateUserLimiter,
} from '@/lib/rate-limit'

export async function allowGooglePlacesGlobal(): Promise<boolean> {
  if (googlePlacesGlobalLimiter) {
    const { success } = await googlePlacesGlobalLimiter.limit('global')
    return success
  }
  return memorySlidingWindowAllow('google-places:out', 150, 60_000)
}

export async function allowCompetitorPlacesForUser(userId: string): Promise<boolean> {
  const id = `u:${userId}`
  if (competitorPlacesUserLimiter) {
    const { success } = await competitorPlacesUserLimiter.limit(id)
    return success
  }
  return memorySlidingWindowAllow(`google-places:user:${userId}`, 28, 3_600_000)
}

export async function allowGoogleTranslateForUser(userId: string): Promise<boolean> {
  if (googleTranslateGlobalLimiter) {
    const { success } = await googleTranslateGlobalLimiter.limit('global')
    if (!success) return false
  } else if (!memorySlidingWindowAllow('google-translate:global', 400, 3_600_000)) {
    return false
  }

  const id = `u:${userId}`
  if (googleTranslateUserLimiter) {
    const { success } = await googleTranslateUserLimiter.limit(id)
    return success
  }
  return memorySlidingWindowAllow(`google-translate:user:${userId}`, 120, 3_600_000)
}

export async function allowGoogleStaticMapForUser(userId: string): Promise<boolean> {
  const id = `u:${userId}`
  if (googleStaticMapUserLimiter) {
    const { success } = await googleStaticMapUserLimiter.limit(id)
    return success
  }
  return memorySlidingWindowAllow(`google-static:user:${userId}`, 72, 3_600_000)
}
