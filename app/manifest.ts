import type { MetadataRoute } from 'next'

/** Installable-ish PWA surface (PDF mobile roadmap): add icons later via `public/` assets. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ReviewPulse',
    short_name: 'ReviewPulse',
    description: 'AI-powered review intelligence and reply workflows for growing businesses.',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0f172a',
    theme_color: '#2563EB',
    categories: ['business', 'productivity'],
  }
}
