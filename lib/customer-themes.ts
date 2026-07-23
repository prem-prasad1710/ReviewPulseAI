import { getOpenAI, resolveLlmChatModel } from '@/lib/openai'

export type CustomerThemesStatus =
  | 'ready'
  | 'no_reviews'
  | 'no_recent_reviews'
  | 'insufficient_reviews'
  | 'no_review_text'
  | 'analysis_unavailable'

export type ThemeItem = {
  topic: string
  emoji: string
  count: number
  sentiment: 'positive' | 'negative'
}

export type CustomerThemesResult = {
  loves: ThemeItem[]
  complaints: ThemeItem[]
  topMentions: string[]
  summary: string
  reviewCount: number
  generatedAt: string
}

const SYSTEM = `You are a review analytics engine for Indian restaurants and local businesses.
Analyse the provided reviews and return ONLY valid JSON matching this schema (no markdown, no explanation):
{
  "loves": [{ "topic": string, "emoji": string, "count": number }],
  "complaints": [{ "topic": string, "emoji": string, "count": number }],
  "topMentions": [string],
  "summary": string
}
Rules:
- "loves": top 4 praised aspects (e.g. "biryani flavour", "staff helpfulness")
- "complaints": top 3 complaint themes (e.g. "slow delivery", "cold food")
- "topMentions": top 5 nouns/phrases (food items, staff names, features)
- "summary": 1 sentence (max 20 words) of the overall customer voice
- "count" = approximate number of reviews mentioning this topic
- Use specific emojis that clearly match the topic (🍜 for food, 🚿 for hygiene, 👨‍🍳 for chef)
- Topics must be specific, not generic ("biryani flavour" not "food")`

export async function analyzeCustomerThemes(
  reviews: Array<{ rating: number; comment: string; sentiment?: string }>,
  businessName: string
): Promise<CustomerThemesResult | null> {
  if (reviews.length === 0) return null

  const reviewText = reviews
    .slice(0, 80)
    .map((r, i) => `[${i + 1}] ${r.rating}★: ${(r.comment || '').slice(0, 250)}`)
    .join('\n')

  const prompt = `Business: ${businessName}\nTotal reviews analysed: ${reviews.length}\n\nReviews:\n${reviewText}`

  try {
    const client = getOpenAI()
    const model = resolveLlmChatModel()

    const chat = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    })

    const raw = chat.choices[0]?.message?.content?.trim()
    if (!raw) return null

    const parsed = JSON.parse(raw) as {
      loves?: Array<{ topic: string; emoji: string; count: number }>
      complaints?: Array<{ topic: string; emoji: string; count: number }>
      topMentions?: string[]
      summary?: string
    }

    return {
      loves: (parsed.loves || []).slice(0, 4).map((l) => ({ ...l, sentiment: 'positive' as const })),
      complaints: (parsed.complaints || []).slice(0, 3).map((c) => ({ ...c, sentiment: 'negative' as const })),
      topMentions: (parsed.topMentions || []).slice(0, 5),
      summary: parsed.summary || '',
      reviewCount: reviews.length,
      generatedAt: new Date().toISOString(),
    }
  } catch (e) {
    console.error('analyzeCustomerThemes error:', e)
    return null
  }
}
