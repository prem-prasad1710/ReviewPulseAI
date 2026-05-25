import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { generateReplyLimiter } from '@/lib/rate-limit'
import { planAllowsFakeScore } from '@/lib/plan-access'
import { analyzeReviewAuthenticityLlm } from '@/lib/review-authenticity-llm'
import { isMongoObjectIdString } from '@/lib/utils'
import Review from '@/models/Review'

const bodySchema = z.object({
  reviewId: z
    .string()
    .trim()
    .min(24)
    .max(24)
    .refine((id) => isMongoObjectIdString(id), { message: 'Invalid review id' }),
  persist: z.boolean().optional().default(true),
})

export async function POST(request: Request) {
  try {
    const authUser = await requireAuth()

    if (generateReplyLimiter) {
      const { success } = await generateReplyLimiter.limit(`auth-llm:${String(authUser._id)}`)
      if (!success) return err('Rate limit exceeded.', 429)
    }

    const body = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    await connectDB()

    const plan = (authUser.plan as string) || 'free'

    const review = await Review.findOne({ _id: parsed.data.reviewId, userId: authUser._id })
    if (!review) return err('Review not found', 404)

    const result = await analyzeReviewAuthenticityLlm({
      reviewerName: review.reviewerName,
      rating: review.rating,
      comment: review.comment ?? '',
    })

    if (parsed.data.persist && planAllowsFakeScore(plan)) {
      await Review.findByIdAndUpdate(review._id, {
        $set: {
          llmAuthenticity: {
            verdict:
              result.verdict === 'likely_inauthentic' ? 'likely_inauthentic' : 'likely_genuine',
            briefReason: result.briefReason,
            confidence: result.confidence,
            analyzedAt: new Date(),
          },
        },
        $addToSet: {
          fakeSignals: `llm:${result.verdict}:${result.briefReason.slice(0, 120)}`,
        },
      })
    }

    return ok({ ...result, persisted: parsed.data.persist && planAllowsFakeScore(plan) })
  } catch (error) {
    console.error('POST /api/ai/analyze-authenticity failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('GROQ_API_KEY') || msg.includes('OPENAI_API_KEY')) {
      return err('AI is not configured for this workspace.', 503)
    }
    return err('Failed to analyze authenticity', 500)
  }
}
