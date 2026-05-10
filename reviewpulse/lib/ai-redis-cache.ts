import { Redis } from '@upstash/redis'
import crypto from 'node:crypto'

/**
 * Caches OpenAI chat outputs in a **dedicated** Upstash Redis (not the same DB as rate limits).
 *
 * Set `UPSTASH_AI_REDIS_REST_URL` + `UPSTASH_AI_REDIS_REST_TOKEN` from a second Upstash database.
 * [Upstash free tier](https://upstash.com) supports multiple Redis instances.
 *
 * Disable entirely: `AI_CACHE_ENABLED=false`
 */
let redisClient: Redis | null | undefined

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient
  const url = process.env.UPSTASH_AI_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_AI_REDIS_REST_TOKEN?.trim()
  redisClient = url && token ? new Redis({ url, token }) : null
  return redisClient
}

export function isAiCacheEnabled(): boolean {
  if (process.env.AI_CACHE_ENABLED === 'false') return false
  return getRedis() !== null
}

function stableHash(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('\x1e'), 'utf8').digest('hex')
}

/** Redis key: `rp:ai:v1:<namespace>:<sha256>` — keep namespaces short. */
export function buildAiCacheKey(namespace: string, ...parts: string[]): string {
  return `rp:ai:v1:${namespace}:${stableHash(parts)}`
}

export function defaultAiCacheTtlSeconds(): number {
  const raw = process.env.AI_CACHE_TTL_SECONDS?.trim()
  const n = raw ? Number.parseInt(raw, 10) : NaN
  return Number.isFinite(n) && n >= 120 ? n : 604_800 // 7 days
}

export function publicFreeReplyCacheTtlSeconds(): number {
  const raw = process.env.AI_CACHE_TTL_PUBLIC_SECONDS?.trim()
  const n = raw ? Number.parseInt(raw, 10) : NaN
  return Number.isFinite(n) && n >= 120 ? n : 259_200 // 3 days
}

export function sentimentCacheTtlSeconds(): number {
  const raw = process.env.AI_CACHE_TTL_SENTIMENT_SECONDS?.trim()
  const n = raw ? Number.parseInt(raw, 10) : NaN
  return Number.isFinite(n) && n >= 120 ? n : 86_400 // 1 day
}

/** Collapse whitespace + lowercase for deduping “same” review text (public / sentiment). */
export function normalizeGenericTextInput(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase()
}

const MAX_CACHED_CHARS = 100_000

export async function getCachedAiText(key: string): Promise<string | null> {
  if (!isAiCacheEnabled()) return null
  const r = getRedis()!
  try {
    const v = await r.get<string>(key)
    return typeof v === 'string' && v.length > 0 ? v : null
  } catch (e) {
    console.warn('[ai-cache] get failed:', e)
    return null
  }
}

export async function setCachedAiText(key: string, value: string, ttlSec: number): Promise<void> {
  if (!isAiCacheEnabled()) return
  const r = getRedis()!
  try {
    const body = value.length > MAX_CACHED_CHARS ? value.slice(0, MAX_CACHED_CHARS) : value
    await r.set(key, body, { ex: ttlSec })
  } catch (e) {
    console.warn('[ai-cache] set failed:', e)
  }
}

export async function withCachedAiText<T extends string>(opts: {
  cacheKey: string
  ttlSeconds?: number
  produce: () => Promise<T>
}): Promise<T> {
  const hit = await getCachedAiText(opts.cacheKey)
  if (hit) return hit as T
  const fresh = await opts.produce()
  if (fresh && String(fresh).length > 0) {
    await setCachedAiText(opts.cacheKey, String(fresh), opts.ttlSeconds ?? defaultAiCacheTtlSeconds())
  }
  return fresh
}

export async function withCachedAiJson<T>(opts: {
  cacheKey: string
  ttlSeconds?: number
  produce: () => Promise<T>
}): Promise<T> {
  const hit = await getCachedAiText(opts.cacheKey)
  if (hit) {
    try {
      return JSON.parse(hit) as T
    } catch {
      /* stale or corrupt */
    }
  }
  const fresh = await opts.produce()
  try {
    await setCachedAiText(opts.cacheKey, JSON.stringify(fresh), opts.ttlSeconds ?? defaultAiCacheTtlSeconds())
  } catch {
    /* ignore */
  }
  return fresh
}

/** Like `withCachedAiJson`, but skips caching when `produce` returns `null`. */
export async function withCachedAiJsonAllowNull<T extends object>(opts: {
  cacheKey: string
  ttlSeconds?: number
  produce: () => Promise<T | null>
}): Promise<T | null> {
  const hit = await getCachedAiText(opts.cacheKey)
  if (hit) {
    try {
      return JSON.parse(hit) as T
    } catch {
      /* miss */
    }
  }
  const fresh = await opts.produce()
  if (fresh != null) {
    await setCachedAiText(opts.cacheKey, JSON.stringify(fresh), opts.ttlSeconds ?? defaultAiCacheTtlSeconds())
  }
  return fresh
}
