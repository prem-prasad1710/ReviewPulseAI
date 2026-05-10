import type { Types } from 'mongoose'
import { publishReviewReply, refreshIfNeeded } from '@/lib/gbp'
import { monitoringUntilForRating } from '@/lib/rating-recovery'
import Location from '@/models/Location'
import Review from '@/models/Review'

const MIN_LEN = 20
const MAX_LEN = 1000

/**
 * Publish a GBP reply for a review owned by `userId` (used by HTTP route + WhatsApp voice flow).
 */
export async function publishUserReviewToGbp(params: {
  userId: Types.ObjectId
  reviewId: Types.ObjectId
  replyText: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const text = params.replyText.trim()
  if (text.length < MIN_LEN || text.length > MAX_LEN) {
    return { ok: false, message: `Reply must be ${MIN_LEN}–${MAX_LEN} characters.` }
  }

  const review = await Review.findOne({ _id: params.reviewId, userId: params.userId })
  if (!review) return { ok: false, message: 'Review not found.' }
  if (review.status !== 'pending' && review.status !== 'scheduled') {
    return { ok: false, message: 'Review is not awaiting a reply.' }
  }

  const location = await Location.findOne({ _id: review.locationId, userId: params.userId })
  if (!location) return { ok: false, message: 'Location not found.' }

  const refreshed = await refreshIfNeeded(location.accessToken, location.refreshToken, location.tokenExpiresAt)

  if (refreshed.encryptedAccessToken && refreshed.encryptedRefreshToken) {
    location.accessToken = refreshed.encryptedAccessToken
    location.refreshToken = refreshed.encryptedRefreshToken
    location.tokenExpiresAt = refreshed.tokenExpiresAt
    await location.save()
  }

  const locationId = location.googleLocationId.split('/').pop() || location.googleLocationId

  try {
    await publishReviewReply({
      accountId: location.googleAccountId,
      locationId,
      reviewId: review.googleReviewId,
      replyText: text,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
    })
  } catch (e) {
    console.error('publishUserReviewToGbp GBP error:', e)
    return { ok: false, message: 'Google did not accept this reply. Open the web inbox to retry or shorten the text.' }
  }

  review.publishedReply = text
  review.status = 'replied'
  review.repliedAt = new Date()
  review.scheduledAt = undefined
  const until = monitoringUntilForRating(review.rating)
  if (until) review.ratingMonitoringUntil = until
  await review.save()

  return { ok: true }
}
