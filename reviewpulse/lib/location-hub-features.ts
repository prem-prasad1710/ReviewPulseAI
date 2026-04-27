import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  ChefHat,
  Clock,
  FileText,
  Grid3x3,
  KeyRound,
  MessageSquare,
  Palette,
  QrCode,
  Radio,
  Target,
  Trophy,
  Users,
} from 'lucide-react'

export type LocationHubLink = {
  label: string
  description: string
  icon: LucideIcon
  /** Relative under `/locations/[id]/` OR special keys `inbox`, `score`, `reports`, `analytics` */
  segment: string
}

export const LOCATION_HUB_LINKS: LocationHubLink[] = [
  {
    label: 'Reviews inbox',
    description: 'Filter and reply to reviews for this outlet only.',
    icon: MessageSquare,
    segment: 'inbox',
  },
  {
    label: 'Tone trainer',
    description: 'Teach the AI your brand voice with past replies.',
    icon: Palette,
    segment: 'tone-trainer',
  },
  {
    label: 'Competitor spy',
    description: 'Themes from nearby rivals on Google Maps.',
    icon: Target,
    segment: 'competitors',
  },
  {
    label: 'Review booster',
    description: 'Smart QR and WhatsApp templates for 5-star asks.',
    icon: QrCode,
    segment: 'booster',
  },
  {
    label: 'Keyword alerts',
    description: 'Crisis and positive keyword monitoring.',
    icon: KeyRound,
    segment: 'keywords',
  },
  {
    label: 'Reply schedule',
    description: 'Business-hours scheduling for published replies.',
    icon: Clock,
    segment: 'settings',
  },
  {
    label: 'Staff shoutouts',
    description: 'Who customers name in reviews.',
    icon: Users,
    segment: 'staff-tracker',
  },
  {
    label: 'Mood heatmap',
    description: 'When reviews skew positive or negative (IST).',
    icon: Grid3x3,
    segment: 'heatmap',
  },
  {
    label: 'Menu insights',
    description: 'What to promote, fix, or drop (Scale).',
    icon: ChefHat,
    segment: 'menu-insights',
  },
  {
    label: 'Offline bridge',
    description: 'NFC / QR visit starter and printable cards.',
    icon: Radio,
    segment: 'offline-bridge',
  },
  {
    label: 'Reputation score',
    description: 'Public scorecard page for this location.',
    icon: Trophy,
    segment: 'score',
  },
  {
    label: 'Analytics',
    description: 'Workspace-wide trends and charts.',
    icon: BarChart3,
    segment: 'analytics',
  },
  {
    label: 'PDF reports',
    description: 'Monthly reputation PDFs (Scale / add-ons).',
    icon: FileText,
    segment: 'reports',
  },
]

export function hrefForLocationHubSegment(
  segment: string,
  locationId: string,
  locationSlug?: string | null
): string {
  switch (segment) {
    case 'inbox':
      return `/reviews?locationId=${encodeURIComponent(locationId)}`
    case 'score':
      return locationSlug ? `/score/${encodeURIComponent(locationSlug)}` : '/locations'
    case 'analytics':
      return '/analytics'
    case 'reports':
      return '/reports'
    default:
      return `/locations/${locationId}/${segment}`
  }
}
