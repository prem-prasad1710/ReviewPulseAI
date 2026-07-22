import type { MetadataRoute } from 'next'
import { BRAND_ICON_SRC } from '@/lib/brand-assets'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ReviewsPulse',
    short_name: 'ReviewsPulse',
    description: 'AI-powered review intelligence and reply workflows for growing businesses.',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0f172a',
    theme_color: '#2563EB',
    categories: ['business', 'productivity'],
    icons: [
      { src: BRAND_ICON_SRC, sizes: '174x144', type: 'image/png' },
      { src: BRAND_ICON_SRC, sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
