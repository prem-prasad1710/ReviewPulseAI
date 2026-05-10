import { getOpenAI } from '@/lib/openai'

export async function analyzeCompetitorThemes(reviewTexts: string[]): Promise<{
  positive: string[]
  negative: string[]
}> {
  const joined = reviewTexts
    .filter(Boolean)
    .slice(0, 40)
    .map((t, i) => `${i + 1}. ${t}`)
    .join('\n')

  const prompt = `Given these reviews, identify the top 3 most praised aspects and top 3 most complained-about issues. Return JSON only: {"positive": string[], "negative": string[]}\n\nReviews:\n${joined || '(none)'}`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0]?.message?.content?.trim() || '{}'
  try {
    const parsed = JSON.parse(raw) as { positive?: string[]; negative?: string[] }
    return {
      positive: Array.isArray(parsed.positive) ? parsed.positive.slice(0, 3) : [],
      negative: Array.isArray(parsed.negative) ? parsed.negative.slice(0, 3) : [],
    }
  } catch {
    return { positive: [], negative: [] }
  }
}
