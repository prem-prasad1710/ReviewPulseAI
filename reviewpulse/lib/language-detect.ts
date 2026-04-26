import { franc } from 'franc-min'

/** Map franc ISO 639-3 to ISO 639-1 for storage. */
const ISO639_3_TO_1: Record<string, string> = {
  eng: 'en',
  hin: 'hi',
  tam: 'ta',
  tel: 'te',
  ben: 'bn',
  mar: 'mr',
  urd: 'ur',
  kan: 'kn',
  mal: 'ml',
  guj: 'gu',
  pan: 'pa',
}

export function detectReviewLanguageIso1(text: string): string {
  if (!text || text.trim().length < 3) return 'en'
  const code3 = franc(text, { minLength: 3 })
  if (code3 === 'und') return 'en'
  return ISO639_3_TO_1[code3] || code3.slice(0, 2)
}

export const LANGUAGE_FLAG_LABEL: Record<string, string> = {
  hi: '🇮🇳',
  ta: '🇮🇳 Tamil',
  te: '🇮🇳 Telugu',
  bn: '🇮🇳 Bengali',
  mr: '🇮🇳 Marathi',
  en: '🇬🇧',
}
