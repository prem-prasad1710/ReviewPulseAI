import { getOpenAI } from '@/lib/openai'

export type ReviewEmotion =
  | 'joy'
  | 'frustration'
  | 'gratitude'
  | 'disappointment'
  | 'anger'
  | 'surprise'
  | 'neutral'

const ALLOWED = new Set<string>([
  'joy',
  'frustration',
  'gratitude',
  'disappointment',
  'anger',
  'surprise',
  'neutral',
])

/** A1 — Classify primary emotion (gpt-4o-mini, ≤150 tokens). */
export async function classifyReviewEmotion(comment: string): Promise<ReviewEmotion | null> {
  const text = comment.trim()
  if (!text) return 'neutral'

  try {
    const openai = getOpenAI()
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 15,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: `Classify the primary emotion in this review into exactly one word from this list only: joy, frustration, gratitude, disappointment, anger, surprise, neutral.

Review text:
"""${text.slice(0, 900)}"""

Reply with ONLY the single word, lowercase, no punctuation.`,
        },
      ],
    })
    const raw = res.choices[0]?.message?.content?.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
    const normalized = raw.replace(/[^a-z]/g, '')
    if (ALLOWED.has(normalized)) return normalized as ReviewEmotion
    return 'neutral'
  } catch (e) {
    console.warn('classifyReviewEmotion failed:', e)
    return null
  }
}
