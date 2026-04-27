const FOOD_KEYWORDS = [
  'restaurant',
  'cafe',
  'food',
  'cloud kitchen',
  'bakery',
  'dhaba',
  'biryani',
  'pizza',
]

const SERVICE_KEYWORDS = ['salon', 'spa', 'clinic', 'beauty', 'parlour', 'massage']

export type MenuInsightMode = 'menu' | 'service' | 'generic'

export function menuInsightModeForCategory(category?: string | null): MenuInsightMode {
  const c = (category || '').toLowerCase()
  if (FOOD_KEYWORDS.some((k) => c.includes(k))) return 'menu'
  if (SERVICE_KEYWORDS.some((k) => c.includes(k))) return 'service'
  return 'generic'
}

export function menuInsightsPageTitle(mode: MenuInsightMode): string {
  if (mode === 'menu') return 'Menu insights'
  if (mode === 'service') return 'Service insights'
  return 'Offer insights'
}

export function recommendationForItem(positiveCount: number, negativeCount: number): {
  label: string
  tone: 'promote' | 'attention' | 'remove' | 'monitor'
} {
  if (positiveCount >= 5 && negativeCount <= 1) {
    return { label: 'Promote this', tone: 'promote' }
  }
  if (negativeCount >= 3 && negativeCount > positiveCount) {
    return { label: 'Needs attention', tone: 'attention' }
  }
  if (negativeCount >= 5 && positiveCount <= 1) {
    return { label: 'Consider removing', tone: 'remove' }
  }
  return { label: 'Keep monitoring', tone: 'monitor' }
}

export function normalizeMenuItemName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}
