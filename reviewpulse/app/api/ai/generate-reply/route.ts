import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { canGenerateReply } from '@/lib/plans'
import { connectDB } from '@/lib/mongodb'
import { generateReplyLimiter } from '@/lib/rate-limit'
import { generateReviewReply } from '@/lib/openai'
import Review from '@/models/Review'
import Location from '@/models/Location'
import User from '@/models/User'

const bodySchema = z.object({
  reviewId: z.string().min(1),
  language: z.enum(['hindi', 'english', 'hinglish']),
  tone: z.enum(['professional', 'friendly', 'formal']).default('professional'),
})

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

    const review = await Review.findOne({ _id: parsed.data.reviewId, userId: user._id })
    if (!review) return err('Review not found', 404)

    const location = await Location.findOne({ _id: review.locationId, userId: user._id }).lean()
    if (!location) return err('Location not found', 404)

    const aiReply = await generateReviewReply({
      businessName: location.name,
      businessCategory: location.category || 'business',
      reviewText: review.comment || '',
      rating: review.rating,
      reviewerName: review.reviewerName,
      language: parsed.data.language,
      tone: parsed.data.tone,
    })

    review.aiGeneratedReply = aiReply
    await review.save()

    await User.findByIdAndUpdate(user._id, { $inc: { repliesUsedThisMonth: 1 } })

    return ok({ reply: aiReply })
  } catch (error) {
    console.error('POST /api/ai/generate-reply failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to generate reply', 500)
  }
}
