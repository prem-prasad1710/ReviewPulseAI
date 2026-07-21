/** Canonical public origin for links, SEO, sitemap, and Open Graph. */
export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`

  const nextAuth = process.env.NEXTAUTH_URL?.trim()
  if (nextAuth) return nextAuth.replace(/\/$/, '')

  return 'http://localhost:3000'
}
