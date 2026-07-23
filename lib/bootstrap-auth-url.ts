/**
 * Align Auth.js base URL with your public domain (e.g. reviewspulse.in).
 * Prevents OAuth callbacks from using *.vercel.app when NEXTAUTH_URL is stale.
 */
export function bootstrapCanonicalAuthUrl() {
  const canonical = (
    process.env.CANONICAL_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    ''
  ).replace(/\/$/, '')

  if (!canonical) return

  process.env.AUTH_URL = canonical
  process.env.NEXTAUTH_URL = canonical

  if (
    process.env.NODE_ENV === 'production' &&
    process.env.VERCEL_URL &&
    canonical.includes('vercel.app')
  ) {
    console.warn(
      '[ReviewsPulse] NEXT_PUBLIC_APP_URL / NEXTAUTH_URL still points to vercel.app — set both to https://reviewspulse.in for OAuth verification and sign-in on your custom domain.'
    )
  }
}
