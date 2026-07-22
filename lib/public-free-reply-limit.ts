import { cookies } from 'next/headers'
import { publicFreeReplyLimiter } from '@/lib/rate-limit'

const COOKIE_NAME = 'rp_free_reply_used'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export type FreeReplyLimitResult =
  | { allowed: true }
  | { allowed: false; reason: 'used' | 'rate'; redirectTo: string }

const REDIRECT = '/login?callbackUrl=%2Fsubscribe%3Fplan%3Dgrowth&reason=free-reply-limit'

/** One free preview per visitor — Redis IP limit + httpOnly cookie fallback. */
export async function checkPublicFreeReplyLimit(ip: string): Promise<FreeReplyLimitResult> {
  const jar = await cookies()
  if (jar.get(COOKIE_NAME)?.value === '1') {
    return { allowed: false, reason: 'used', redirectTo: REDIRECT }
  }

  if (publicFreeReplyLimiter) {
    const { success } = await publicFreeReplyLimiter.limit(`free-reply:${ip}`)
    if (!success) {
      return { allowed: false, reason: 'rate', redirectTo: REDIRECT }
    }
    return { allowed: true }
  }

  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PUBLIC_FREE_REPLY_WITHOUT_REDIS !== 'true') {
    throw new Error('FREE_REPLY_REDIS_REQUIRED')
  }

  return { allowed: true }
}

export async function markPublicFreeReplyUsed() {
  const jar = await cookies()
  jar.set(COOKIE_NAME, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
}
