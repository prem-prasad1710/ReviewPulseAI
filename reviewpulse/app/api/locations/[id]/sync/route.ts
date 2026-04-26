import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { processReviewAfterSync } from '@/lib/review-post-sync'
import { connectDB } from '@/lib/mongodb'
import { analyzeSentiment } from '@/lib/openai'
import { listLocationReviews, refreshIfNeeded } from '@/lib/gbp'
import type { GbpReview } from '@/lib/gbp'
import Location from '@/models/Location'
import Review from '@/models/Review'

function normalizeRating(starRating?: string) {
  const map: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
    STAR_RATING_UNSPECIFIED: 0,
  }
  return map[starRating || 'STAR_RATING_UNSPECIFIED'] || 0
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()

    const { id } = await params
    const location = await Location.findOne({ _id: id, userId: user._id })
    if (!location) return err('Location not found', 404)

    const refreshed = await refreshIfNeeded(location.accessToken, location.refreshToken, location.tokenExpiresAt)

    if (refreshed.encryptedAccessToken && refreshed.encryptedRefreshToken) {
      location.accessToken = refreshed.encryptedAccessToken
      location.refreshToken = refreshed.encryptedRefreshToken
      location.tokenExpiresAt = refreshed.tokenExpiresAt
      await location.save()
    }

    const locationId = location.googleLocationId.split('/').pop() || location.googleLocationId

    const reviews = await listLocationReviews(location.googleAccountId, locationId, refreshed.accessToken)

    for (const item of reviews as GbpReview[]) {
      const reviewId = item.reviewId || item.name?.split('/').pop()
      if (!reviewId) continue

      const rating = normalizeRating(item.starRating || undefined)
      const comment = item.comment || ''
      const sentimentPayload = await analyzeSentiment(comment || 'No text review', rating || 3)

      const reviewDoc = await Review.findOneAndUpdate(
        { userId: user._id, googleReviewId: reviewId },
        {
          $set: {
            locationId: location._id,
            userId: user._id,
            googleReviewId: reviewId,
            reviewerName: item.reviewer?.displayName || 'Google User',
            reviewerPhoto: item.reviewer?.profilePhotoUrl,
            rating,
            comment,
            sentiment: sentimentPayload.sentiment,
            sentimentScore: sentimentPayload.sentimentScore,
            reviewCreatedAt: item.createTime ? new Date(item.createTime) : new Date(),
            syncedAt: new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )

      if (reviewDoc?._id) {
        await processReviewAfterSync(reviewDoc._id)
      }
    }

    location.lastSyncedAt = new Date()
    location.totalReviews = reviews.length
    location.averageRating =
      reviews.length > 0
        ? (reviews as GbpReview[]).reduce(
            (acc: number, current: GbpReview) => acc + normalizeRating(current.starRating || undefined),
            0
          ) / reviews.length
        : 0
    await location.save()

    return ok({ syncedReviews: reviews.length })
  } catch (error) {
    console.error('POST /api/locations/[id]/sync failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to sync reviews', 500)
  }
}
