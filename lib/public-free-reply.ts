import { getOpenAI } from '@/lib/openai'
import {
  buildAiCacheKey,
  normalizeGenericTextInput,
  publicFreeReplyCacheTtlSeconds,
  withCachedAiText,
} from '@/lib/ai-redis-cache'

export type PublicReplyLanguage = 'english' | 'hindi' | 'hinglish'

/**
 * One-off reply for the public free tool (no DB, no quota). Always gpt-4o-mini per product rules.
 */
export async function generatePublicFreeReply(params: {
  reviewText: string
  rating: number
  businessName?: string
  language: PublicReplyLanguage
}): Promise<string> {
  const { reviewText, rating, businessName, language } = params
  const name = (businessName || 'our business').slice(0, 80)
  const text = reviewText.trim().slice(0, 4000)

  const langLine =
    language === 'hindi'
      ? 'Write ONLY in Hindi (Devanagari). Professional restaurant/clinic tone.'
      : language === 'hinglish'
        ? 'Write in natural Hinglish (Hindi + English mix) as Indian SMB owners use on WhatsApp.'
        : 'Write in clear Indian English, warm and professional.'

  const openai = getOpenAI()
  const userContent = `Business: ${name}\nStar rating: ${rating}/5\nReview:\n${text}`

  const cacheKey = buildAiCacheKey(
    'public-free-reply',
    'gpt-4o-mini',
    normalizeGenericTextInput(text).slice(0, 4000),
    String(rating),
    language,
    name
  )

  return withCachedAiText({
    cacheKey,
    ttlSeconds: publicFreeReplyCacheTtlSeconds(),
    produce: async () => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.45,
        max_tokens: 500,
        messages: [
          {
            role: 'system',
            content: `You draft a short Google Business Profile reply for a local business in India.
Rules:
- ${langLine}
- 80–160 words; never under 40 characters.
- For 1–2 stars: apologize sincerely, no excuses, offer resolution / invite offline contact.
- For 3 stars: acknowledge and improve.
- For 4–5 stars: thank warmly, invite return.
- No discounts unless user review explicitly mentions one.
- No medical/legal/financial advice.
- Output ONLY the reply text, no quotes or labels.`,
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
      })
      const out = completion.choices[0]?.message?.content?.trim() || ''
      return out.slice(0, 1500)
    },
  })
}
