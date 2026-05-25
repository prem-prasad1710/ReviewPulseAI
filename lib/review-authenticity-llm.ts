/**
 * PDF spec: lightweight LLM classifier for suspicious vs genuine narratives.
 * Supplemental to heuristic fakeScore (lib/fake-score.ts) — advisory only.
 */
import { getOpenAI, resolveLlmChatModel } from '@/lib/openai'
import {
  buildAiCacheKey,
  defaultAiCacheTtlSeconds,
  withCachedAiJson,
} from '@/lib/ai-redis-cache'

export type LlmAuthenticityVerdict = 'likely_genuine' | 'likely_inauthentic'

export interface LlmAuthenticityResult {
  verdict: LlmAuthenticityVerdict
  briefReason: string
  /** 0–1 confidence */
  confidence: number
}

export async function analyzeReviewAuthenticityLlm(params: {
  reviewerName?: string
  rating: number
  comment?: string
}): Promise<LlmAuthenticityResult> {
  const text = params.comment?.trim() || '(Rating only — no comment)'
  const prompt = `You are an advisory review authenticity reviewer for SMB owners. NEVER accuse named individuals illegally.
Analyze whether the CONTENT below looks more like genuine customer feedback vs generic/suspicious/promotional review spam.

Respond ONLY JSON: {"verdict":"likely_genuine"|"likely_inauthentic","confidence": number 0 to 1, "briefReason": string max 120 chars}

Heuristics (not deterministic):
- likely_inauthentic: empty praise, unnatural marketing tone, contradictory stars vs text, copy-paste feel, bizarre URLs mentioned
- likely_genuine: specific details about service/product, balanced tone, credible complaint or praise with context

Stars: ${params.rating}/5
Reviewer label (do not harass): "${(params.reviewerName || '').slice(0, 48)}"

Review content:
"${text.slice(0, 2000)}"`

  const cacheKey = buildAiCacheKey('authenticity-llm', resolveLlmChatModel(), prompt)
  return withCachedAiJson({
    cacheKey,
    ttlSeconds: defaultAiCacheTtlSeconds(),
    produce: async () => {
      const response = await getOpenAI().chat.completions.create({
        model: resolveLlmChatModel(),
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.15,
        max_tokens: 200,
      })
      const raw = response.choices[0]?.message?.content?.trim() ?? '{}'
      const parsed = JSON.parse(raw) as {
        verdict?: string
        briefReason?: string
        confidence?: number
      }
      const verdict: LlmAuthenticityVerdict =
        parsed.verdict === 'likely_inauthentic' ? 'likely_inauthentic' : 'likely_genuine'
      let confidence =
        typeof parsed.confidence === 'number' && Number.isFinite(parsed.confidence)
          ? Math.min(1, Math.max(0, parsed.confidence))
          : 0.6
      const briefReason =
        typeof parsed.briefReason === 'string' ? parsed.briefReason.slice(0, 280) : 'Pattern review complete.'
      return { verdict, confidence, briefReason }
    },
  })
}
