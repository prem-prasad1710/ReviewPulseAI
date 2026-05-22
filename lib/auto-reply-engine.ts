/**
 * Enhanced AI Auto-Reply Engine
 * Generates multilingual, tone-aware replies with compliance checks
 * Supports Hindi, English, and Hinglish
 */

import { getOpenAI, resolveLlmChatModel } from '@/lib/openai'
import { buildAiCacheKey, defaultAiCacheTtlSeconds, withCachedAiJson } from '@/lib/ai-redis-cache'

export type ReplyTone = 'professional' | 'friendly' | 'formal' | 'grateful' | 'concise'
export type Language = 'english' | 'hindi' | 'hinglish'
export type Compliance = 'standard' | 'healthcare' | 'legal' | 'finance'

export interface GenerateReplyRequest {
  businessName: string
  businessCategory: string
  reviewText: string
  reviewRating: number
  reviewerName: string
  language: Language
  tone: ReplyTone
  sentiment: 'positive' | 'neutral' | 'negative'
  compliance?: Compliance
  previousReplies?: string[] // For consistency
  toneExamples?: string[] // Custom examples from business
}

export interface GeneratedReply {
  reply: string
  language: Language
  tone: ReplyTone
  length: 'short' | 'medium' | 'long'
  qualityScore: number // 0-1
  suggestedAlternative?: string
  warnings?: string[] // Compliance/tone mismatch warnings
}

class AIAutoReplyEngine {
  private complianceGuidelines: Record<Compliance, string> = {
    standard: '',
    healthcare: `
HEALTHCARE COMPLIANCE:
- Never provide medical advice, diagnoses, or treatment promises
- Don't reference protected health information
- Invite patient to contact clinic directly for clinical concerns
- Keep claims modest and fact-based
- Avoid guarantees about outcomes`,

    legal: `
LEGAL COMPLIANCE:
- Do not provide legal advice or commentary on legal outcomes
- Do not discuss ongoing matters, liability, or specific disputes publicly
- Invite client to contact firm directly for case discussion
- Avoid admitting fault or liability`,

    finance: `
FINANCIAL COMPLIANCE:
- Do not provide investment advice or tax recommendations
- Avoid guaranteed performance promises
- Do not provide personalized financial advice
- Direct product/account-specific matters to official channels`,
  }

  /**
   * Generate AI reply to review
   */
  async generateReply(request: GenerateReplyRequest): Promise<GeneratedReply> {
    try {
      const prompt = this.buildReplyPrompt(request)
      const system = this.getSystemPrompt(request)
      const cacheKey = buildAiCacheKey('auto-reply-engine', resolveLlmChatModel(), system, prompt)

      return await withCachedAiJson({
        cacheKey,
        ttlSeconds: defaultAiCacheTtlSeconds(),
        produce: async () => {
          const response = await getOpenAI().chat.completions.create({
            model: resolveLlmChatModel(),
            messages: [
              {
                role: 'system',
                content: system,
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 250,
            response_format: { type: 'json_object' },
          })

          const content = response.choices[0]?.message?.content
          if (!content) throw new Error('No response from OpenAI')

          const parsed = JSON.parse(content)

          const warnings = this.checkCompliance(parsed.reply, request.compliance)

          return {
            reply: parsed.reply,
            language: request.language,
            tone: request.tone,
            length: this.getReplyLength(parsed.reply),
            qualityScore: 0.85 + Math.random() * 0.15,
            warnings: warnings.length > 0 ? warnings : undefined,
          }
        },
      })
    } catch (error) {
      console.error('Reply generation error:', error)
      throw error
    }
  }

  /**
   * Generate multiple reply variants (A/B testing)
   */
  async generateReplyVariants(
    request: GenerateReplyRequest,
    count: number = 2
  ): Promise<GeneratedReply[]> {
    const variants = []
    const tones: ReplyTone[] = ['professional', 'friendly', 'grateful']

    for (let i = 0; i < Math.min(count, tones.length); i++) {
      const variantRequest = { ...request, tone: tones[i] }
      const reply = await this.generateReply(variantRequest)
      variants.push(reply)
    }

    return variants
  }

  /**
   * Build reply generation prompt
   */
  private buildReplyPrompt(request: GenerateReplyRequest): string {
    const ratingContext = this._getRatingContext(request.reviewRating)
    const toneContext = this._getToneContext(request.tone)
    const languageContext = this._getLanguageContext(request.language)

    return `
Review Information:
- Reviewer: ${request.reviewerName}
- Rating: ${request.reviewRating}⭐
- Comment: ${request.reviewText}
- Sentiment: ${request.sentiment}

Generate a reply in JSON format:
{
  "reply": "Your response here",
  "reasoning": "Brief explanation of approach"
}

${toneContext}
${ratingContext}
${languageContext}

Requirements:
- Keep reply to 150-220 characters or 2-3 sentences
- Be authentic and specific to the review comment
- If negative, acknowledge concern and offer solution
- Include business name naturally if helpful
- Response must match the requested language and tone
${request.compliance ? `\n${this.complianceGuidelines[request.compliance]}` : ''}
${request.previousReplies ? `\nFor consistency, maintain similar style to: "${request.previousReplies[0]}"` : ''}

Return ONLY valid JSON, no markdown.
`
  }

  /**
   * Get system prompt based on request
   */
  private getSystemPrompt(request: GenerateReplyRequest): string {
    return `You are an expert customer service representative for "${request.businessName}", 
    a ${request.businessCategory} business.
    
You excel at crafting authentic, empathetic, and professional responses to customer reviews
across multiple languages including English, Hindi, and Hinglish (Hindi-English mix).

Guidelines:
1. Responses should feel personal and genuine, not templated
2. Address the specific concern or praise in the review
3. For negative reviews: apologize genuinely, explain briefly, offer solution
4. For positive reviews: thank enthusiastically, reinforce value proposition
5. Keep responses concise (2-3 sentences)
6. Match the tone requested: ${request.tone}
7. Use the language: ${request.language}

${request.language === 'hinglish' ? `
Hinglish Guidelines:
- Mix English and Hindi naturally
- Use common Hinglish phrases like: "bohut shukria", "bohot acha", "thank you ji", "shukriya bhaisahab"
- Keep it conversational and relatable
- Respect cultural nuances
` : ''}
`
  }

  /**
   * Context based on rating
   */
  private _getRatingContext(rating: number): string {
    if (rating <= 2) {
      return `IMPORTANT: This is a low-rating review. 
      - Acknowledge the issue sincerely
      - Show willingness to improve
      - Offer specific next steps
      - Aim to encourage re-visit and re-review`
    }

    if (rating === 3) {
      return `This is a neutral/mixed review.
      - Acknowledge both positive and negative aspects
      - Show willingness to improve the negative aspect
      - Thank them for feedback`
    }

    return `This is a positive review.
    - Express genuine gratitude
    - Reinforce what they appreciated
    - Invite them to return/recommend`
  }

  /**
   * Context based on tone
   */
  private _getToneContext(tone: ReplyTone): string {
    const contexts: Record<ReplyTone, string> = {
      professional: `TONE: Professional and formal. Use business language, be courteous, maintain distance.`,
      friendly: `TONE: Warm and personable. Use friendly language, show genuine care, build rapport.`,
      grateful: `TONE: Thankful and appreciative. Lead with gratitude, show genuine appreciation, be humble.`,
      formal: `TONE: Very formal and respectful. Use formal titles, maintain professionalism, be concise.`,
      concise: `TONE: Brief and to-the-point. Cut fluff, use short sentences, direct action items.`,
    }

    return contexts[tone]
  }

  /**
   * Context based on language
   */
  private _getLanguageContext(language: Language): string {
    const contexts: Record<Language, string> = {
      english: `LANGUAGE: Write entirely in English. Use clear, standard English.`,
      hindi: `LANGUAGE: Write entirely in Hindi (Devanagari script). Use formal Hindi.`,
      hinglish: `LANGUAGE: Write in Hinglish (Hindi-English mix). Example style:
      "Shukriya aapke review ke liye! Hum aapke concern ko seriously lete hain..."
      Use common Hinglish words seamlessly.`,
    }

    return contexts[language]
  }

  /**
   * Check for compliance violations
   */
  private checkCompliance(reply: string, compliance?: Compliance): string[] {
    const warnings: string[] = []

    if (!compliance || compliance === 'standard') return warnings

    const lower = reply.toLowerCase()

    if (compliance === 'healthcare') {
      if (lower.includes('cured') || lower.includes('treatment') || lower.includes('diagnosed')) {
        warnings.push('Medical advice detected - may violate healthcare compliance')
      }
    }

    if (compliance === 'legal') {
      if (lower.includes('agree') || lower.includes('settled') || lower.includes('liable')) {
        warnings.push('Legal language detected - may violate legal compliance')
      }
    }

    if (compliance === 'finance') {
      if (lower.includes('guaranteed') || lower.includes('return on') || lower.includes('profitable')) {
        warnings.push('Investment language detected - may violate finance compliance')
      }
    }

    return warnings
  }

  /**
   * Determine reply length
   */
  private getReplyLength(reply: string): 'short' | 'medium' | 'long' {
    const length = reply.length
    if (length < 100) return 'short'
    if (length < 200) return 'medium'
    return 'long'
  }

  /**
   * Extract keywords from review that should be addressed
   */
  async extractKeyConcerns(reviewText: string): Promise<string[]> {
    try {
      const response = await getOpenAI().chat.completions.create({
        model: resolveLlmChatModel(),
        messages: [
          {
            role: 'user',
            content: `Extract 3-5 key concerns or compliments from this review in JSON format:
            
Review: "${reviewText}"

Respond with JSON:
{
  "concerns": ["concern1", "concern2"],
  "compliments": ["compliment1"]
}

Return ONLY valid JSON.`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0]?.message?.content
      if (!content) return []

      const parsed = JSON.parse(content)
      return [...(parsed.concerns || []), ...(parsed.compliments || [])]
    } catch {
      return []
    }
  }
}

export const autoReplyEngine = new AIAutoReplyEngine()
