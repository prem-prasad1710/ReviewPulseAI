/**
 * PDF spec: condense recent reviews into praise / complaint bullets (English output for owner).
 * Batches up to ~12 reviews per call; trims long comments.
 */
import { getOpenAI, resolveLlmChatModel } from '@/lib/openai'
import {
  buildAiCacheKey,
  defaultAiCacheTtlSeconds,
  withCachedAiJson,
} from '@/lib/ai-redis-cache'

export type ReviewSnippet = { text: string; rating: number; reviewerName?: string }

export interface ReviewSummaryResult {
  positives: string[]
  negatives: string[]
  /** One-line executive summary for busy owners */
  headline: string
}

function trimSnippet(s: string, max = 400): string {
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : `${t.slice(0, max)}…`
}

export async function summarizeReviewsForOwner(
  businessName: string,
  reviews: ReviewSnippet[]
): Promise<ReviewSummaryResult> {
  if (reviews.length === 0) {
    return { positives: [], negatives: [], headline: 'No reviews in this period yet.' }
  }

  const payload = reviews.slice(0, 14).map((r, i) => ({
    i: i + 1,
    rating: r.rating,
    reviewer: (r.reviewerName || 'Customer').slice(0, 40),
    text: trimSnippet(r.text || '(no text)', 450),
  }))

  const prompt = `You are an assistant for Indian SMB owners. Read these customer reviews and produce a concise JSON summary.

Business: "${businessName}"

Reviews (JSON):
${JSON.stringify(payload)}

Rules:
- Output ONLY valid JSON with shape: {"headline": string, "positives": string[], "negatives": string[]}
- "headline": one short sentence (max 25 words) capturing the week’s pulse.
- "positives": 2–5 bullet strings (no numbering) for recurring praise themes.
- "negatives": 2–5 bullet strings for recurring complaints; empty array if none.
- Do not copy profanity or personal attacks; replace with "[redacted]".
- Do not include reviewer names or private data in bullets.
- Write bullets in clear English (owners may also read Hindi context from reviews).`

  const cacheKey = buildAiCacheKey('review-summary', resolveLlmChatModel(), prompt)
  return withCachedAiJson({
    cacheKey,
    ttlSeconds: defaultAiCacheTtlSeconds(),
    produce: async () => {
      const response = await getOpenAI().chat.completions.create({
        model: resolveLlmChatModel(),
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.35,
        max_tokens: 500,
      })
      const raw = response.choices[0]?.message?.content?.trim() ?? '{}'
      const parsed = JSON.parse(raw) as {
        headline?: string
        positives?: string[]
        negatives?: string[]
      }
      return {
        headline:
          typeof parsed.headline === 'string' ? parsed.headline : 'Mixed feedback across recent reviews.',
        positives: Array.isArray(parsed.positives) ? parsed.positives.filter(Boolean).slice(0, 8) : [],
        negatives: Array.isArray(parsed.negatives) ? parsed.negatives.filter(Boolean).slice(0, 8) : [],
      }
    },
  })
}
