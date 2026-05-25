import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { generateReplyLimiter } from '@/lib/rate-limit'
import { summarizeReviewsForOwner } from '@/lib/review-summarisation'
import Review from '@/models/Review'
import Location from '@/models/Location'
import type { Types } from 'mongoose'

const bodySchema = z.object({
  locationId: z.string().trim().optional(),
  days: z.coerce.number().min(1).max(90).default(7),
})

export async function POST(request: Request) {
  try {
    const user = await requireAuth()

    if (generateReplyLimiter) {
      const { success } = await generateReplyLimiter.limit(`summarize:${String(user._id)}`)
      if (!success) return err('Rate limit exceeded. Try again shortly.', 429)
    }

    const body = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    await connectDB()

    const since = new Date()
    since.setDate(since.getDate() - parsed.data.days)

    let businessName = 'Your business'
    let scopedLocationId: Types.ObjectId | undefined

    if (parsed.data.locationId) {
      const loc = await Location.findOne({ _id: parsed.data.locationId, userId: user._id }).lean()
      if (!loc) return err('Location not found', 404)
      businessName = loc.name || businessName
      scopedLocationId = loc._id
    } else {
      const topLoc = await Location.findOne({ userId: user._id }).sort({ totalReviews: -1 }).select('name').lean()
      if (topLoc?.name) businessName = topLoc.name
    }

    const filter: Record<string, unknown> = { userId: user._id, reviewCreatedAt: { $gte: since } }
    if (scopedLocationId) filter.locationId = scopedLocationId

    const rows = await Review.find(filter)
      .sort({ reviewCreatedAt: -1 })
      .limit(40)
      .select('comment rating reviewerName reviewCreatedAt')
      .lean()

    const summary = await summarizeReviewsForOwner(
      businessName,
      rows.map((r) => ({
        text: r.comment || '',
        rating: r.rating,
        reviewerName: r.reviewerName,
      }))
    )

    return ok({
      ...summary,
      reviewCount: rows.length,
      windowDays: parsed.data.days,
      businessLabel: businessName,
    })
  } catch (error) {
    console.error('POST /api/ai/summarize-reviews failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('GROQ_API_KEY') || msg.includes('OPENAI_API_KEY')) {
      return err('AI is not configured for this workspace.', 503)
    }
    return err('Failed to summarize reviews', 500)
  }
}
