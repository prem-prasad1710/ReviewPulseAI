/** Best-effort client IP for rate limiting behind proxies (Vercel, nginx). */
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first.slice(0, 64)
  }
  const real = request.headers.get('x-real-ip')?.trim()
  if (real) return real.slice(0, 64)
  return 'unknown'
}
