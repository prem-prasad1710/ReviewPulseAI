/**
 * OAuth callbacks must use the same host the user signed in from (reviewspulse.in).
 * A stale NEXTAUTH_URL / AUTH_URL pointing at *.vercel.app breaks Google's token exchange.
 */
export function bootstrapCanonicalAuthUrl() {
  const canonical = (
    process.env.CANONICAL_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    ''
  ).replace(/\/$/, '')

  const authUrl = (process.env.AUTH_URL || process.env.NEXTAUTH_URL || '').replace(/\/$/, '')

  // Drop preview URLs so Auth.js trustHost uses x-forwarded-host from the live request.
  if (authUrl.includes('vercel.app')) {
    delete process.env.AUTH_URL
    delete process.env.NEXTAUTH_URL
    if (canonical) {
      console.info(
        `[ReviewsPulse] Removed vercel.app auth base URL; OAuth uses request host. NEXT_PUBLIC_APP_URL=${canonical}`
      )
    } else {
      console.warn(
        '[ReviewsPulse] NEXTAUTH_URL was *.vercel.app — cleared for OAuth. Set NEXT_PUBLIC_APP_URL=https://reviewspulse.in in Vercel.'
      )
    }
    return
  }

  // When only a canonical public URL exists, mirror it for server-side links (not required for OAuth).
  if (canonical && !authUrl) {
    process.env.AUTH_URL = canonical
    process.env.NEXTAUTH_URL = canonical
  }
}
