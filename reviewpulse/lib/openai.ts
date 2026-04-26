import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface GenerateReplyParams {
  businessName: string
  businessCategory: string
  reviewText: string
  rating: number
  reviewerName: string
  language: 'hindi' | 'english' | 'hinglish'
  tone: 'professional' | 'friendly' | 'formal'
}

export async function generateReviewReply(params: GenerateReplyParams): Promise<string> {
  const { businessName, businessCategory, reviewText, rating, reviewerName, language, tone } = params

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
  }[tone]

  const sentimentContext =
    rating >= 4
      ? 'This is a positive review. Thank the customer genuinely, mention a specific detail from their review if possible, and invite them back.'
      : rating === 3
        ? 'This is a neutral or mixed review. Acknowledge their feedback, address any concern briefly, and invite them to experience improvement.'
        : 'This is a negative review. Apologize sincerely, do not make excuses, offer to resolve offline, and show commitment to improvement.'

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
- Write ONLY the reply text. No preamble, labels, or explanation.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 250,
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content?.trim() ?? ''
}

export async function analyzeSentiment(reviewText: string, stars: number) {
  const prompt = `Rate the sentiment of this review on a scale from -1.0 (very negative) to 1.0 (very positive). Reply with ONLY a number.\nReview: "${reviewText}"\nRating: ${stars}/5`

  const response = await openai.chat.completions.create({
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
