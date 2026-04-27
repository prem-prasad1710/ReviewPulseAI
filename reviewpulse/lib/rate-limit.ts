import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

export const generateReplyLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: 'reviewpulse:generate-reply',
    })
  : null

/** Prevents subscription spam / double-checkout abuse (per user). */
export const subscriptionCreateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      analytics: true,
      prefix: 'reviewpulse:subscription-create',
    })
  : null

/** Social content generation (paid) — per user. */
export const socialPostLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 h'),
      analytics: true,
      prefix: 'reviewpulse:social-post',
    })
  : null

/** Public bridge track — per slug + IP to reduce abuse. */
export const bridgeTrackLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, '1 h'),
      analytics: true,
      prefix: 'reviewpulse:bridge-track',
    })
  : null

/** Sync all locations — avoid hammering GBP / OpenAI. */
export const syncAllLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(8, '1 h'),
      analytics: true,
      prefix: 'reviewpulse:sync-all',
    })
  : null
