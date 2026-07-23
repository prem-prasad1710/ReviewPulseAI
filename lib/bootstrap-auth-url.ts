/**
 * OAuth must use the host the user actually visits (www or apex).
 * Do NOT force AUTH_URL from NEXT_PUBLIC_APP_URL — that causes redirect loops when
 * Vercel's primary domain differs (e.g. Vercel sends apex→www while Auth sends www→apex).
 */
export function bootstrapCanonicalAuthUrl() {
  const authUrl = (process.env.AUTH_URL || process.env.NEXTAUTH_URL || '').replace(/\/$/, '')

  if (!authUrl.includes('vercel.app')) return

  delete process.env.AUTH_URL
  delete process.env.NEXTAUTH_URL

  const canonical = (process.env.CANONICAL_APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').trim()
  if (canonical) {
    console.info(
      `[ReviewsPulse] Removed vercel.app auth URL; OAuth uses request host. Canonical links use ${canonical}`
    )
  } else {
    console.warn(
      '[ReviewsPulse] Cleared vercel.app NEXTAUTH_URL. Set NEXT_PUBLIC_APP_URL to your primary domain for SEO/crons.'
    )
  }
}
