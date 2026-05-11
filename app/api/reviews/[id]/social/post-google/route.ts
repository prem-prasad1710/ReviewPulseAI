import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { createGoogleLocalPost, refreshIfNeeded } from '@/lib/gbp'
import { connectDB } from '@/lib/mongodb'
import { planAllowsSocialPostFull } from '@/lib/plan-access'
import Location from '@/models/Location'
import Review from '@/models/Review'
import SocialPost from '@/models/SocialPost'
import User from '@/models/User'

const bodySchema = z.object({
  summary: z.string().min(10).max(1500),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params

    const u = await User.findById(user._id).select('plan').lean()
    const plan = String(u?.plan || '')
    if (!planAllowsSocialPostFull(plan)) {
      return err('Post to Google is available on Growth and Scale.', 403)
    }

    const review = await Review.findOne({ _id: id, userId: user._id })
    if (!review) return err('Review not found', 404)

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    const location = await Location.findOne({ _id: review.locationId, userId: user._id })
    if (!location) return err('Location not found', 404)

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

    await createGoogleLocalPost({
      accountId: location.googleAccountId,
      locationId,
      accessToken: refreshed.accessToken,
      summary: parsed.data.summary,
      languageCode: 'en',
    })

    await SocialPost.updateMany(
      { reviewId: review._id, userId: user._id, platform: 'google' },
      { $set: { wasPostedToGoogle: true, generatedText: parsed.data.summary } }
    )

    return ok({ posted: true })
  } catch (error) {
    console.error('POST /api/reviews/[id]/social/post-google failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err(error instanceof Error ? error.message : 'Failed to post', 500)
  }
}
