import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { publishUserReviewToGbp } from '@/lib/review-publish-internal'
import Review from '@/models/Review'

const bodySchema = z.object({
  replyText: z.string().min(20).max(1000),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()

    const { id } = await params
    const review = await Review.findOne({ _id: id, userId: user._id })
    if (!review) return err('Review not found', 404)

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    const pub = await publishUserReviewToGbp({
      userId: user._id,
      reviewId: review._id,
      replyText: parsed.data.replyText,
    })
    if (!pub.ok) return err(pub.message, 400)

    return ok({ published: true })
  } catch (error) {
    console.error('POST /api/reviews/[id]/reply failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to publish reply', 500)
  }
}
