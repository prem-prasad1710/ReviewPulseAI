import type { Types } from 'mongoose'
import { markRatingRecoveredAndNotify, shouldRecoverRating } from '@/lib/rating-recovery'
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

export type SyncLocationOutcome =
  | { ok: true; syncedReviews: number }
  | { ok: false; error: string; status?: number }

/**
 * Fetches GBP reviews for one location, upserts Review docs, runs post-sync hooks, updates aggregates.
 * Used by single-location sync and “sync all”.
 */
export async function syncLocationReviewsForUser(
  userId: Types.ObjectId,
  locationMongoId: string
): Promise<SyncLocationOutcome> {
  await connectDB()

  const location = await Location.findOne({ _id: locationMongoId, userId })
  if (!location) {
    return { ok: false, error: 'Location not found', status: 404 }
  }

  try {
    const refreshed = await refreshIfNeeded(location.accessToken, location.refreshToken, location.tokenExpiresAt)

    if (refreshed.encryptedAccessToken && refreshed.encryptedRefreshToken) {
      location.accessToken = refreshed.encryptedAccessToken
      location.refreshToken = refreshed.encryptedRefreshToken
      location.tokenExpiresAt = refreshed.tokenExpiresAt
      await location.save()
    }

    const gbpLocationId = location.googleLocationId.split('/').pop() || location.googleLocationId
    const reviews = await listLocationReviews(location.googleAccountId, gbpLocationId, refreshed.accessToken)

    for (const item of reviews as GbpReview[]) {
      const reviewId = item.reviewId || item.name?.split('/').pop()
      if (!reviewId) continue

      const prior = await Review.findOne({ userId, googleReviewId: reviewId })
        .select('rating ratingMonitoringUntil ratingRecovered')
        .lean()

      const rating = normalizeRating(item.starRating || undefined)
      const comment = item.comment || ''
      const sentimentPayload = await analyzeSentiment(comment || 'No text review', rating || 3)

      const reviewDoc = await Review.findOneAndUpdate(
        { userId, googleReviewId: reviewId },
        {
          $set: {
            locationId: location._id,
            userId,
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

      if (
        reviewDoc?._id &&
        prior &&
        shouldRecoverRating(prior, rating) &&
        typeof prior.rating === 'number'
      ) {
        await markRatingRecoveredAndNotify({
          reviewId: reviewDoc._id as Types.ObjectId,
          userId,
          locationName: location.name,
          reviewerName: reviewDoc.reviewerName || 'Google User',
          oldRating: prior.rating,
          newRating: rating,
        })
      }

      if (reviewDoc?._id) {
        await processReviewAfterSync(reviewDoc._id)
      }
    }

    location.lastSyncedAt = new Date()
    location.totalReviews = reviews.length
    location.lastKnownReviewCount = reviews.length
    location.averageRating =
      reviews.length > 0
        ? (reviews as GbpReview[]).reduce(
            (acc: number, current: GbpReview) => acc + normalizeRating(current.starRating || undefined),
            0
          ) / reviews.length
        : 0
    await location.save()

    return { ok: true, syncedReviews: reviews.length }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sync failed'
    return { ok: false, error: message, status: 500 }
  }
}
