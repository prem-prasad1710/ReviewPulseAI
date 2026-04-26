export function defaultAlertKeywordsForCategory(category?: string | null): Array<{
  keyword: string
  type: 'crisis' | 'positive'
  enabled: boolean
}> {
  const c = (category || '').toLowerCase()
  if (c.includes('restaurant') || c.includes('food')) {
    return [
      { keyword: 'cockroach', type: 'crisis', enabled: true },
      { keyword: 'rat', type: 'crisis', enabled: true },
      { keyword: 'food poisoning', type: 'crisis', enabled: true },
      { keyword: 'rude', type: 'crisis', enabled: true },
      { keyword: 'cold food', type: 'crisis', enabled: true },
      { keyword: 'hair in food', type: 'crisis', enabled: true },
      { keyword: 'dirty', type: 'crisis', enabled: true },
      { keyword: 'overpriced', type: 'crisis', enabled: true },
    ]
  }
  if (c.includes('clinic') || c.includes('medical') || c.includes('hospital')) {
    return [
      { keyword: 'wrong diagnosis', type: 'crisis', enabled: true },
      { keyword: 'rude doctor', type: 'crisis', enabled: true },
      { keyword: 'long wait', type: 'crisis', enabled: true },
      { keyword: 'expired', type: 'crisis', enabled: true },
      { keyword: 'infection', type: 'crisis', enabled: true },
      { keyword: 'overcharged', type: 'crisis', enabled: true },
    ]
  }
  if (c.includes('salon') || c.includes('spa') || c.includes('hair')) {
    return [
      { keyword: 'cut wrong', type: 'crisis', enabled: true },
      { keyword: 'burned', type: 'crisis', enabled: true },
      { keyword: 'unhygienic', type: 'crisis', enabled: true },
      { keyword: 'rude', type: 'crisis', enabled: true },
      { keyword: 'allergic', type: 'crisis', enabled: true },
    ]
  }
  return []
}
