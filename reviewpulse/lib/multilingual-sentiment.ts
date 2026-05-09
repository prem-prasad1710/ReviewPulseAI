/**
 * Multilingual Sentiment Analysis
 * Supports English, Hindi, and Hinglish with nuanced emotion detection
 */

import { getOpenAI } from '@/lib/openai'

export type Language = 'english' | 'hindi' | 'hinglish'
export type Sentiment = 'positive' | 'neutral' | 'negative'
export type Emotion =
  | 'joy'
  | 'frustration'
  | 'gratitude'
  | 'disappointment'
  | 'anger'
  | 'surprise'
  | 'neutral'

export interface SentimentAnalysisResult {
  sentiment: Sentiment
  sentimentScore: number // 0-1
  emotion: Emotion
  emotionConfidence: number // 0-1
  detectedLanguage: Language
  keyPhrases: string[]
  urgency: 'low' | 'medium' | 'high' // For alerting
  summary: string
}

class MultilingualSentimentAnalyzer {
  private openai = getOpenAI()

  /**
   * Analyze sentiment of review text with multilingual support
   */
  async analyzeReview(text: string, language?: Language): Promise<SentimentAnalysisResult> {
    try {
      const prompt = this.buildAnalysisPrompt(text, language)

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('No response from OpenAI')

      const parsed = JSON.parse(content)

      return {
        sentiment: parsed.sentiment,
        sentimentScore: parsed.sentimentScore,
        emotion: parsed.emotion,
        emotionConfidence: parsed.emotionConfidence,
        detectedLanguage: parsed.detectedLanguage,
        keyPhrases: parsed.keyPhrases,
        urgency: this.calculateUrgency(parsed.sentiment, parsed.sentimentScore),
        summary: parsed.summary,
      }
    } catch (error) {
      console.error('Sentiment analysis error:', error)
      // Fallback: basic sentiment detection
      return this.fallbackAnalysis(text)
    }
  }

  /**
   * Batch analyze multiple reviews efficiently
   */
  async analyzeBatch(reviews: Array<{ id: string; text: string }>) {
    return Promise.all(
      reviews.map(r => this.analyzeReview(r.text).then(result => ({ id: r.id, ...result })))
    )
  }

  /**
   * Build prompt for sentiment analysis
   */
  private buildAnalysisPrompt(text: string, language?: Language): string {
    return `
Analyze this review text and provide sentiment analysis in JSON format.

Review text: "${text}"

Respond with a JSON object containing:
{
  "sentiment": "positive" | "neutral" | "negative",
  "sentimentScore": number between 0 (very negative) and 1 (very positive),
  "emotion": "joy" | "frustration" | "gratitude" | "disappointment" | "anger" | "surprise" | "neutral",
  "emotionConfidence": number between 0 and 1,
  "detectedLanguage": "english" | "hindi" | "hinglish",
  "keyPhrases": array of important phrases from the review,
  "summary": one-line summary of the key issue or praise
}

Guidelines:
- For Hindi/Hinglish: Detect common words/patterns (e.g., "bahut acha", "bilkul bekaar", "kaafi maza")
- Emotion should reflect genuine emotional tone, not just sentiment polarity
- Key phrases should highlight specific pain points or compliments
- Sentiment score: 0-0.33 (negative), 0.34-0.66 (neutral), 0.67-1.0 (positive)

Return ONLY valid JSON, no markdown or extra text.
`
  }

  /**
   * Calculate urgency level for alerting
   */
  private calculateUrgency(sentiment: Sentiment, score: number): 'low' | 'medium' | 'high' {
    if (sentiment === 'negative' && score < 0.2) return 'high'
    if (sentiment === 'negative' && score < 0.4) return 'medium'
    if (sentiment === 'neutral' && score < 0.3) return 'medium'
    return 'low'
  }

  /**
   * Fallback basic sentiment detection (no API call)
   */
  private fallbackAnalysis(text: string): SentimentAnalysisResult {
    const lower = text.toLowerCase()

    // Positive indicators
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'perfect', 'love', 'awesome', 'badhiya', 'zabardast', 'shundar']
    // Negative indicators
    const negativeWords = ['bad', 'terrible', 'awful', 'poor', 'worst', 'hate', 'disappointing', 'bekaar', 'bhayanak', 'ghatiya']

    const posCount = positiveWords.filter(w => lower.includes(w)).length
    const negCount = negativeWords.filter(w => lower.includes(w)).length

    let sentiment: Sentiment = 'neutral'
    let sentimentScore = 0.5
    let emotion: Emotion = 'neutral'

    if (posCount > negCount) {
      sentiment = 'positive'
      sentimentScore = 0.7 + Math.random() * 0.3
      emotion = posCount > 2 ? 'joy' : 'gratitude'
    } else if (negCount > posCount) {
      sentiment = 'negative'
      sentimentScore = 0.2 + Math.random() * 0.2
      emotion = negCount > 2 ? 'anger' : 'disappointment'
    }

    return {
      sentiment,
      sentimentScore,
      emotion,
      emotionConfidence: 0.6,
      detectedLanguage: this.detectLanguage(text),
      keyPhrases: [],
      urgency: this.calculateUrgency(sentiment, sentimentScore),
      summary: `Review is ${sentiment}`,
    }
  }

  /**
   * Simple language detection
   */
  private detectLanguage(text: string): Language {
    const hindiChars = /[\u0900-\u097F]/g
    const englishWords = text.match(/\b[a-zA-Z]+\b/g) || []

    const hindiMatches = text.match(hindiChars) || []

    if (hindiMatches.length > text.length * 0.3) return 'hindi'
    if (hindiMatches.length > 0 && englishWords.length > 0) return 'hinglish'
    return 'english'
  }

  /**
   * Generate insight summary for dashboard
   */
  async generateInsightSummary(reviews: SentimentAnalysisResult[]): Promise<{
    totalReviews: number
    averageSentiment: number
    sentiment_breakdown: Record<string, number>
    emotion_breakdown: Record<string, number>
    topIssues: string[]
  }> {
    const sentiments = reviews.map(r => r.sentiment)
    const emotions = reviews.map(r => r.emotion)
    const keyPhrases = reviews.flatMap(r => r.keyPhrases)

    // Count sentiments
    const sentimentCounts: Record<string, number> = {}
    sentiments.forEach(s => {
      sentimentCounts[s] = (sentimentCounts[s] || 0) + 1
    })

    // Count emotions
    const emotionCounts: Record<string, number> = {}
    emotions.forEach(e => {
      emotionCounts[e] = (emotionCounts[e] || 0) + 1
    })

    // Find top issues (negative key phrases)
    const issuePhrases = reviews
      .filter(r => r.sentiment === 'negative')
      .flatMap(r => r.keyPhrases)
      .slice(0, 5)

    return {
      totalReviews: reviews.length,
      averageSentiment: reviews.reduce((sum, r) => sum + r.sentimentScore, 0) / reviews.length,
      sentiment_breakdown: sentimentCounts,
      emotion_breakdown: emotionCounts,
      topIssues: issuePhrases,
    }
  }
}

export const sentimentAnalyzer = new MultilingualSentimentAnalyzer()
