/** Canonical public origin for links, SEO, sitemap, and Open Graph. */
export function getAppUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    ''

  if (!raw) return 'http://localhost:3000'

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return withProtocol.replace(/\/$/, '')
}
