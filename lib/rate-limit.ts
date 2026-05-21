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

/** SEO / acquisition — free reply preview (no auth). Requires Redis in production (see route guard). */
export const publicFreeReplyLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(12, '1 h'),
      analytics: true,
      prefix: 'reviewpulse:public-free-reply',
    })
  : null

/** Public embed widget JSON — per slug + IP. */
export const publicWidgetLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, '1 h'),
      analytics: true,
      prefix: 'reviewpulse:public-widget',
    })
  : null

/** Competitor Spy — authenticated Places lookups per user (add + analyze backfill). */
export const competitorPlacesUserLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(32, '1 h'),
      analytics: true,
      prefix: 'reviewpulse:competitor-places-user',
    })
  : null

/** Bound total Places outbound calls per minute (cron + dashboards). */
export const googlePlacesGlobalLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, '1 m'),
      analytics: true,
      prefix: 'reviewpulse:google-places-global',
    })
  : null

export const googleTranslateUserLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(140, '1 h'),
      analytics: true,
      prefix: 'reviewpulse:google-translate-user',
    })
  : null

export const googleTranslateGlobalLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(2_800, '1 h'),
      analytics: true,
      prefix: 'reviewpulse:google-translate-global',
    })
  : null

/** Static Maps thumbnail proxy — per authenticated user. */
export const googleStaticMapUserLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(80, '1 h'),
      analytics: true,
      prefix: 'reviewpulse:google-static-map-user',
    })
  : null
