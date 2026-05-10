import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { MOCK_REVIEWS, shouldUseDashboardMocks } from '@/lib/dev-mock-dashboard'
import { canGenerateReply } from '@/lib/plans'
import { connectDB } from '@/lib/mongodb'
import { generateReplyLimiter } from '@/lib/rate-limit'
import { generateReviewReply } from '@/lib/openai'
import { mergeReplySchedule, nextAvailableSlot } from '@/lib/reply-schedule'
import { planAllowsReplyScheduler, planAllowsToneTrainer } from '@/lib/plan-access'
import Review from '@/models/Review'
import Location from '@/models/Location'
import User from '@/models/User'

const bodySchema = z.object({
  reviewId: z.string().min(1),
  language: z.enum(['hindi', 'english', 'hinglish']),
  tone: z
    .enum(['professional', 'friendly', 'formal', 'grateful', 'concise'])
    .default('professional'),
  /** When true, skip few-shot tone examples (for A/B preview on Tone Trainer). */
  skipToneExamples: z.boolean().optional(),
})

function buildMockAiReply(
  reviewerName: string,
  rating: number,
  text: string,
  lang: 'hindi' | 'english' | 'hinglish',
  tone: string
) {
  const first = reviewerName.split(/\s+/)[0] || 'there'
  if (lang === 'hindi') {
    return `${first} जी, आपकी प्रतिक्रिया के लिए धन्यवाद। हम आपके अनुभव को और बेहतर बनाने के लिए प्रतिबद्ध हैं।`
  }
  if (lang === 'hinglish') {
    return `${first}, thanks a ton for the honest feedback — really means a lot. Team is already on it to make your next visit smoother.`
  }
  const toneBit =
    tone === 'formal'
      ? 'We appreciate you taking the time to share this feedback.'
      : tone === 'grateful'
        ? 'We are truly grateful that you chose us and shared your experience.'
        : tone === 'concise'
          ? 'Thanks for the note — noted and actioned.'
          : 'Thank you for the thoughtful review.'
  if (rating >= 4) {
    const snippet = text ? `—especially "${text.slice(0, 72)}${text.length > 72 ? '…' : ''}"` : ''
    return `${toneBit} ${first}, we are delighted you enjoyed your visit${snippet}. We look forward to welcoming you again soon. Warmly, the team.`
  }
  if (rating === 3) {
    return `${toneBit} ${first}, we hear you and are tightening the gaps you mentioned. We would love another chance to earn a five-star experience—please reach out if we can help personally.`
  }
  return `${toneBit} ${first}, we are sorry this missed the mark. A manager will follow up today to make this right. Your trust matters deeply to us.`
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()

    if (generateReplyLimiter) {
      const identifier = `u:${String(user._id)}`
      const { success } = await generateReplyLimiter.limit(identifier)
      if (!success) return err('Rate limit exceeded. Try again in a minute.', 429)
    }

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    const quota = canGenerateReply(user)
    if (!quota.allowed) return err(quota.reason || 'Plan quota exceeded', 403)

    await connectDB()

    if (shouldUseDashboardMocks()) {
      const mock = MOCK_REVIEWS.find((r) => r._id === parsed.data.reviewId)
      if (mock) {
        const lang = parsed.data.language
        const tone = parsed.data.tone
        const reply = buildMockAiReply(mock.reviewerName, mock.rating, mock.comment || '', lang, tone)
        return ok({ reply })
      }
    }

    const review = await Review.findOne({ _id: parsed.data.reviewId, userId: user._id })
    if (!review) return err('Review not found', 404)

    const location = await Location.findOne({ _id: review.locationId, userId: user._id }).lean()
    if (!location) return err('Location not found', 404)

    const plan = user.plan as string
    const ab = location.replyAbTest as
      | { enabled?: boolean; variantLabelA?: string; variantLabelB?: string; activeKey?: 'A' | 'B' }
      | undefined
    let abStyleHint: string | undefined
    let abVariant: 'A' | 'B' | undefined
    if (ab?.enabled) {
      abVariant =
        ab.activeKey === 'A' || ab.activeKey === 'B'
          ? ab.activeKey
          : Math.random() > 0.5
            ? 'A'
            : 'B'
      const label =
        abVariant === 'A'
          ? (ab.variantLabelA || 'Warm / descriptive')
          : (ab.variantLabelB || 'Crisp / direct')
      abStyleHint = `Use reply style ${abVariant} (“${label}”). ${
        abVariant === 'A' ? 'Lean slightly warmer and a bit more detailed.' : 'Keep tighter and more direct.'
      }`
    }

    const toneExamples =
      !parsed.data.skipToneExamples &&
      planAllowsToneTrainer(plan) &&
      Array.isArray(location.toneExamples) &&
      location.toneExamples.length > 0
        ? location.toneExamples
        : undefined

    const complianceMode = (location.complianceMode as 'standard' | 'healthcare' | 'legal' | 'finance' | undefined) || 'standard'

    const aiReply = await generateReviewReply({
      businessName: location.name,
      businessCategory: location.category || 'business',
      reviewText: review.comment || '',
      rating: review.rating,
      reviewerName: review.reviewerName,
      language: parsed.data.language,
      tone: parsed.data.tone,
      toneExamples,
      detectedLanguageIso1: review.detectedLanguage || undefined,
      festiveAutoMode: location.festiveAutoMode !== false,
      complianceMode,
      abStyleHint,
    })

    const schedule = mergeReplySchedule(
      location.replySchedule as {
        enabled?: boolean
        startHour?: number
        endHour?: number
        workingDays?: number[]
        timezone?: string
      } | null
    )

    if (
      review.status !== 'replied' &&
      planAllowsReplyScheduler(plan) &&
      schedule.enabled
    ) {
      review.aiGeneratedReply = aiReply
      review.status = 'scheduled'
      review.scheduledAt = nextAvailableSlot(schedule)
    } else {
      review.aiGeneratedReply = aiReply
    }
    if (abVariant) review.replyAbVariant = abVariant
    await review.save()

    await User.findByIdAndUpdate(user._id, { $inc: { repliesUsedThisMonth: 1 } })

    return ok({ reply: aiReply, scheduled: review.status === 'scheduled' })
  } catch (error) {
    console.error('POST /api/ai/generate-reply failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to generate reply', 500)
  }
}
