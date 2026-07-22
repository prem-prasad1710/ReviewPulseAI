/** Client IP for rate limiting (Vercel / reverse-proxy aware). */
export function clientIp(request: Request): string {
  const xf = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (xf) return xf.slice(0, 64)
  const real = request.headers.get('x-real-ip')?.trim()
  if (real) return real.slice(0, 64)
  return 'unknown'
}

export const getClientIp = clientIp

/** True when Redis-backed limits are required in production. */
export function requireRedisRateLimitInProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

export function redisRateLimitUnavailableResponse() {
  return Response.json(
    { error: 'Service temporarily unavailable. Try again later.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } }
  )
}
