import type { MetadataRoute } from 'next'

const base = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['', '/login', '/dashboard', '/reviews', '/locations', '/analytics', '/settings']
  const now = new Date()
  return paths.map((path) => ({
    url: `${base}${path || '/'}`,
    lastModified: now,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path === '/login' ? 0.9 : 0.6,
  }))
}
