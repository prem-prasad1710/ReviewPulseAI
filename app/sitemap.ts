import type { MetadataRoute } from 'next'
import { getAppUrl } from '@/lib/app-url'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl()
  const paths: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'] }> = [
    { path: '', priority: 1, changeFrequency: 'weekly' },
    { path: '/login', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/tools/free-reply', priority: 0.95, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  ]
  const now = new Date()
  return paths.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path || '/'}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))
}
