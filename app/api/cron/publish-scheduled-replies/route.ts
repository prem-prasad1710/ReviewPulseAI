import { err, ok } from '@/lib/api'
import { connectDB } from '@/lib/mongodb'
import { publishReviewReply, refreshIfNeeded } from '@/lib/gbp'
import { monitoringUntilForRating } from '@/lib/rating-recovery'
import Location from '@/models/Location'
import Review from '@/models/Review'

/** Vercel Cron invokes with GET; keep POST for manual / external triggers. */
export async function GET(request: Request) {
  return POST(request)
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const secret = process.env.CRON_SECRET
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return err('Unauthorized', 401)
    }

    await connectDB()
    const now = new Date()
    const due = await Review.find({
      status: 'scheduled',
      scheduledAt: { $lte: now },
      aiGeneratedReply: { $exists: true, $ne: '' },
    })
      .limit(200)
      .lean()

    let published = 0
    for (const r of due) {
      const location = await Location.findOne({ _id: r.locationId, userId: r.userId })
      if (!location) continue
      if (location.crisisMode) continue
      const refreshed = await refreshIfNeeded(
        location.accessToken,
        location.refreshToken,
        location.tokenExpiresAt
      )
      if (refreshed.encryptedAccessToken && refreshed.encryptedRefreshToken) {
        location.accessToken = refreshed.encryptedAccessToken
        location.refreshToken = refreshed.encryptedRefreshToken
        location.tokenExpiresAt = refreshed.tokenExpiresAt
        await location.save()
      }
      const locationId = location.googleLocationId.split('/').pop() || location.googleLocationId
      const text = r.aiGeneratedReply || ''
      if (text.length < 20) continue
      try {
        await publishReviewReply({
          accountId: location.googleAccountId,
          locationId,
          reviewId: r.googleReviewId,
          replyText: text,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
        })
        const rating = typeof (r as { rating?: number }).rating === 'number' ? (r as { rating: number }).rating : 5
        const until = monitoringUntilForRating(rating)
        await Review.findByIdAndUpdate(r._id, {
          $set: {
            publishedReply: text,
            status: 'replied',
            repliedAt: new Date(),
            scheduledAt: undefined,
            ...(until ? { ratingMonitoringUntil: until } : {}),
          },
        })
        published += 1
      } catch (e) {
        console.error('publish-scheduled-replies item failed:', e)
      }
    }

    return ok({ checked: due.length, published })
  } catch (error) {
    console.error('POST publish-scheduled-replies failed:', error)
    return err('Cron failed', 500)
  }
}
