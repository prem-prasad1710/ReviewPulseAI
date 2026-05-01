import OpenAI from 'openai'
import { getCurrentFestival } from '@/lib/festivals'

let cachedOpenAI: OpenAI | null = null

/** Lazy client so `next build` does not require OPENAI_API_KEY at module load (e.g. on Vercel). */
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  if (!cachedOpenAI) {
    cachedOpenAI = new OpenAI({ apiKey })
  }
  return cachedOpenAI
}

export type ReplyComplianceMode = 'standard' | 'healthcare' | 'legal' | 'finance'

function compliancePromptAddon(mode: ReplyComplianceMode | undefined): string {
  switch (mode) {
    case 'healthcare':
      return `\n\nCOMPLIANCE (HEALTHCARE):
- Do not give medical advice, diagnoses, or treatment promises.
- Do not reference or request protected health information.
- Invite the reviewer to contact the clinic or care team directly for clinical concerns.
- Keep claims modest; no guaranteed outcomes.`
    case 'legal':
      return `\n\nCOMPLIANCE (LEGAL SERVICES):
- Do not offer legal advice or commentary on legal outcomes.
- Do not discuss ongoing matters, liability, or disputes in public.
- Invite the reviewer to contact the firm directly for case-specific discussion.`
    case 'finance':
      return `\n\nCOMPLIANCE (FINANCIAL SERVICES):
- Do not give investment, tax, or guaranteed performance promises.
- Avoid language that could read as personalized financial advice.
- Direct product or account-specific matters to official offline channels.`
    default:
      return ''
  }
}

interface GenerateReplyParams {
  businessName: string
  businessCategory: string
  reviewText: string
  rating: number
  reviewerName: string
  language: 'hindi' | 'english' | 'hinglish'
  tone: 'professional' | 'friendly' | 'formal' | 'grateful' | 'concise'
  toneExamples?: string[]
  /** ISO 639-1 from review detection; when not English, reply should match customer language. */
  detectedLanguageIso1?: string
  /** Z3: when false, skip festive greeting injection. */
  festiveAutoMode?: boolean
  /** D2: stricter reply boundaries for regulated verticals. */
  complianceMode?: ReplyComplianceMode
  /** A5 — optional A/B style nudge appended to the prompt. */
  abStyleHint?: string
}

export async function generateReviewReply(params: GenerateReplyParams): Promise<string> {
  const {
    businessName,
    businessCategory,
    reviewText,
    rating,
    reviewerName,
    language,
    tone,
    toneExamples,
    detectedLanguageIso1,
    festiveAutoMode = true,
    complianceMode = 'standard',
    abStyleHint,
  } = params

  const languageInstruction = {
    hindi: 'Respond ONLY in Hindi (Devanagari script). Do not use English except for proper nouns.',
    english: 'Respond in professional Indian English.',
    hinglish:
      'Respond in Hinglish - natural mix of Hindi and English words written in Roman script, the way young Indians text.',
  }[language]

  const toneInstruction = {
    professional: 'Maintain a professional, courteous business tone.',
    friendly: "Be warm, friendly, and approachable. Use the reviewer's name.",
    formal: 'Be formal and respectful. Suitable for clinics and legal or financial services.',
    grateful: 'Lead with sincere gratitude. Sound genuinely thankful without being salesy.',
    concise: 'Be brief and direct: 2–3 short sentences maximum. No filler.',
  }[tone]

  const sentimentContext =
    rating >= 4
      ? 'This is a positive review. Thank the customer genuinely, mention a specific detail from their review if possible, and invite them back.'
      : rating === 3
        ? 'This is a neutral or mixed review. Acknowledge their feedback, address any concern briefly, and invite them to experience improvement.'
        : 'This is a negative review. Apologize sincerely, do not make excuses, offer to resolve offline, and show commitment to improvement.'

  const fewShot =
    toneExamples && toneExamples.length > 0
      ? `\n\nHere are examples of how this business owner writes replies. Match their exact style, tone, and language mix:\n\n${toneExamples.slice(0, 10).join('\n---\n')}`
      : ''

  const sameLanguageNote =
    detectedLanguageIso1 && detectedLanguageIso1 !== 'en'
      ? `\n\nIMPORTANT: Write the reply in ${detectedLanguageIso1} language. The customer wrote in that language — always reply in the same language to show respect.`
      : ''

  const festival = festiveAutoMode && rating >= 3 ? getCurrentFestival() : null
  const festiveNote =
    festival && rating >= 3
      ? `\n\nToday is ${festival.name} in India. If it feels natural and appropriate, you may weave a brief ${festival.greeting} greeting into the reply. Skip it entirely for complaints or very short reviews.`
      : ''

  const complianceNote = compliancePromptAddon(complianceMode)
  const abNote = abStyleHint ? `\n\nA/B VARIANT: ${abStyleHint}` : ''

  const prompt = `You are writing a Google review reply on behalf of "${businessName}", a ${businessCategory} in India.

REVIEWER: ${reviewerName}
STAR RATING: ${rating}/5
REVIEW TEXT: "${reviewText || '(No text - rating only)'}"

INSTRUCTIONS:
- ${languageInstruction}
- ${toneInstruction}
- ${sentimentContext}
- Keep the reply between 60-120 words. Never exceed 150 words.
- Do not include hashtags, emojis, or marketing slogans.
- Do not start with "Dear".
- Do not mention competitors.
- End with a warm closing that fits the business type.
- Write ONLY the reply text. No preamble, labels, or explanation.${fewShot}${sameLanguageNote}${complianceNote}${abNote}${festiveNote}`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 250,
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content?.trim() ?? ''
}

export async function analyzeSentiment(reviewText: string, stars: number) {
  const prompt = `Rate the sentiment of this review on a scale from -1.0 (very negative) to 1.0 (very positive). Reply with ONLY a number.\nReview: "${reviewText}"\nRating: ${stars}/5`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 10,
    temperature: 0,
  })

  const score = Number(response.choices[0]?.message?.content?.trim() || '0')
  const safeScore = Number.isFinite(score) ? Math.max(-1, Math.min(1, score)) : 0

  const sentiment = safeScore > 0.2 ? 'positive' : safeScore < -0.2 ? 'negative' : 'neutral'

  return { sentiment, sentimentScore: safeScore }
}

export interface ReviewAutopsyResult {
  rootCause: string
  suggestedFix: string
}

export async function runReviewAutopsy(params: {
  businessName: string
  businessCategory: string
  negativeReviewLines: string[]
}): Promise<ReviewAutopsyResult | null> {
  const lines = params.negativeReviewLines.join('\n')
  if (!lines.trim()) return null

  const prompt = `You are a sharp operations consultant for Indian small businesses.
Given these negative customer reviews for a ${params.businessCategory} called '${params.businessName}':

${lines}

Identify:
1. ROOT_CAUSE: The single most common underlying operational problem (1 sentence, specific, not generic)
2. FIX: A concrete action the owner can take THIS WEEK to address it (1–2 sentences)

Return JSON only: {"rootCause": string, "suggestedFix": string}`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    temperature: 0.3,
  })

  const raw = response.choices[0]?.message?.content?.trim() ?? ''
  try {
    const parsed = JSON.parse(raw) as { rootCause?: string; suggestedFix?: string }
    if (!parsed.rootCause || !parsed.suggestedFix) return null
    return { rootCause: parsed.rootCause, suggestedFix: parsed.suggestedFix }
  } catch {
    return null
  }
}

export interface StaffMentionExtracted {
  name: string
  sentiment: 'positive' | 'negative' | 'neutral'
  quote: string
}

export async function extractStaffMentionsFromReview(reviewText: string): Promise<StaffMentionExtracted[]> {
  if (!reviewText.trim()) return []

  const prompt = `Extract all staff/employee names mentioned in this customer review.
For each name, determine if the mention is positive, negative, or neutral.
Extract a short quote (max 10 words) showing the context.
Review: '${reviewText.replace(/'/g, "\\'")}'
Return JSON array only: [{"name": string, "sentiment": "positive"|"negative"|"neutral", "quote": string}]
If no staff names found, return [].`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.2,
  })

  const raw = response.choices[0]?.message?.content?.trim() ?? ''
  try {
    const arr = JSON.parse(raw) as Array<{ name?: string; sentiment?: string; quote?: string }>
    if (!Array.isArray(arr)) return []
    return arr
      .filter((x) => x.name && x.sentiment && x.quote)
      .map((x) => ({
        name: toTitleCase(String(x.name).trim()),
        sentiment: (['positive', 'negative', 'neutral'].includes(String(x.sentiment))
          ? x.sentiment
          : 'neutral') as StaffMentionExtracted['sentiment'],
        quote: String(x.quote).slice(0, 200),
      }))
  } catch {
    return []
  }
}

function toTitleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ')
    .trim()
}

export interface SocialFormatsResult {
  instagram: string
  whatsapp: string
  googlePost: string
}

export async function generateSocialFormats(params: {
  businessName: string
  businessCategory: string
  reviewText: string
  language: string
}): Promise<SocialFormatsResult | null> {
  const prompt = `A customer left this review for ${params.businessName} (${params.businessCategory}): '${params.reviewText.replace(/'/g, "\\'")}'

Generate social media content to celebrate this positive feedback:

1. INSTAGRAM: 3–4 lines, warm and celebratory, ends with 5 relevant hashtags. In ${params.language}.
2. WHATSAPP: 1–2 lines max. Very short, emoji-friendly tone (no actual emoji — use text). In ${params.language}.
3. GOOGLE_POST: 2–3 professional sentences with a clear CTA to visit. In ${params.language}.

Return JSON only: {"instagram": string, "whatsapp": string, "googlePost": string}`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
    temperature: 0.6,
  })

  const raw = response.choices[0]?.message?.content?.trim() ?? ''
  try {
    const parsed = JSON.parse(raw) as Partial<SocialFormatsResult>
    if (!parsed.instagram || !parsed.whatsapp || !parsed.googlePost) return null
    return {
      instagram: parsed.instagram,
      whatsapp: parsed.whatsapp,
      googlePost: parsed.googlePost,
    }
  } catch {
    return null
  }
}

export interface MenuInsightBatchItem {
  name: string
  positiveCount: number
  negativeCount: number
  sampleQuote: string
}

export async function extractMenuInsightsFromBatch(params: {
  consultantLabel: 'restaurant' | 'salon'
  itemLabel: 'food item' | 'service'
  reviewsBatch: string
}): Promise<MenuInsightBatchItem[]> {
  const prompt = `You are a ${params.consultantLabel} consultant. From these customer reviews, extract every ${params.itemLabel} mentioned.
For each, count how many times it's mentioned positively vs negatively.
Include a sample quote for context.
Reviews batch: ${params.reviewsBatch}
Return JSON only: {"items": [{"name": string, "positiveCount": number, "negativeCount": number, "sampleQuote": string}]}`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
    temperature: 0.3,
  })

  const raw = response.choices[0]?.message?.content?.trim() ?? ''
  try {
    const parsed = JSON.parse(raw) as { items?: MenuInsightBatchItem[] }
    if (!parsed.items || !Array.isArray(parsed.items)) return []
    return parsed.items.map((i) => ({
      name: String(i.name || '').trim(),
      positiveCount: Math.max(0, Number(i.positiveCount) || 0),
      negativeCount: Math.max(0, Number(i.negativeCount) || 0),
      sampleQuote: String(i.sampleQuote || '').slice(0, 300),
    }))
  } catch {
    return []
  }
}
