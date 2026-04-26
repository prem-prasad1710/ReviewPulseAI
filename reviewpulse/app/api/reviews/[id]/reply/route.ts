import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { publishReviewReply, refreshIfNeeded } from '@/lib/gbp'
import Location from '@/models/Location'
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

    const location = await Location.findOne({ _id: review.locationId, userId: user._id })
    if (!location) return err('Location not found', 404)

    const refreshed = await refreshIfNeeded(location.accessToken, location.refreshToken, location.tokenExpiresAt)

    if (refreshed.encryptedAccessToken && refreshed.encryptedRefreshToken) {
      location.accessToken = refreshed.encryptedAccessToken
      location.refreshToken = refreshed.encryptedRefreshToken
      location.tokenExpiresAt = refreshed.tokenExpiresAt
      await location.save()
    }

    const locationId = location.googleLocationId.split('/').pop() || location.googleLocationId

    await publishReviewReply({
      accountId: location.googleAccountId,
      locationId,
      reviewId: review.googleReviewId,
      replyText: parsed.data.replyText,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
    })

    review.publishedReply = parsed.data.replyText
    review.status = 'replied'
    review.repliedAt = new Date()
    await review.save()

    return ok({ published: true })
  } catch (error) {
    console.error('POST /api/reviews/[id]/reply failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to publish reply', 500)
  }
}
