import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { generateSocialFormats } from '@/lib/openai'
import { planAllowsSocialPostFull, isPaidPlan } from '@/lib/plan-access'
import { socialPostLimiter } from '@/lib/rate-limit'
import { serverErr } from '@/lib/production-error'
import Location from '@/models/Location'
import Review from '@/models/Review'
import SocialPost from '@/models/SocialPost'
const bodySchema = z.object({
  language: z.string().min(2).max(40).default('English'),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params

    const plan = String(user.plan || '')
    if (!isPaidPlan(plan)) {
      return err('Upgrade your plan to use social content.', 403)
    }

    if (socialPostLimiter) {
      const { success } = await socialPostLimiter.limit(`u:${String(user._id)}`)
      if (!success) return err('Too many social generations. Try again in an hour.', 429)
    }

    const review = await Review.findOne({ _id: id, userId: user._id })
    if (!review) return err('Review not found', 404)
    if (review.rating < 4) return err('Social content is available for 4★ and 5★ reviews.', 400)

    const body = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    const location = await Location.findOne({ _id: review.locationId, userId: user._id }).lean()
    if (!location) return err('Location not found', 404)

    const formats = await generateSocialFormats({
      businessName: location.name,
      businessCategory: location.category || 'business',
      reviewText: review.comment || '(rating only)',
      language: parsed.data.language,
    })

    if (!formats) return err('Could not generate content. Try again.', 500)

    await SocialPost.deleteMany({ reviewId: review._id, userId: user._id })

    const platforms: Array<'instagram' | 'whatsapp' | 'google'> = ['instagram', 'whatsapp', 'google']
    const texts = [formats.instagram, formats.whatsapp, formats.googlePost]
    for (let i = 0; i < platforms.length; i++) {
      await SocialPost.create({
        locationId: review.locationId,
        reviewId: review._id,
        userId: user._id,
        platform: platforms[i],
        generatedText: texts[i],
        wasPostedToGoogle: false,
      })
    }

    if (planAllowsSocialPostFull(plan)) {
      await Location.updateOne({ _id: location._id }, { $inc: { socialPostsGenerated: 1 } })
    }

    return ok({
      ...formats,
      canDownloadGraphic: planAllowsSocialPostFull(plan),
      canPostToGoogle: planAllowsSocialPostFull(plan),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return serverErr('reviews/social', error)
  }
}
