import type { MetadataRoute } from 'next'
import { getAppUrl } from '@/lib/app-url'

export default function robots(): MetadataRoute.Robots {
  const base = getAppUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/tools/free-reply', '/about', '/privacy', '/terms', '/login'],
        disallow: [
          '/api/',
          '/dashboard',
          '/reviews',
          '/locations',
          '/settings',
          '/subscribe',
          '/agency',
          '/developer',
          '/integrations',
          '/escalations',
          '/analytics',
          '/reports',
          '/templates',
          '/partner',
          '/support',
          '/docs',
          '/v2',
          '/sentry-example-page',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
