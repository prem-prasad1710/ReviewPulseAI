import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { analyzeCustomerThemes } from '@/lib/customer-themes'
import Location from '@/models/Location'
import Review from '@/models/Review'

const qSchema = z.object({
  locationId: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    await connectDB()

    const url = new URL(request.url)
    const parsed = qSchema.safeParse({ locationId: url.searchParams.get('locationId') })
    if (!parsed.success) return err('Invalid query', 400)

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const matchQuery: Record<string, unknown> = {
      userId: user._id,
      reviewCreatedAt: { $gte: thirtyDaysAgo },
    }

    let businessName = 'your business'

    if (parsed.data.locationId) {
      const loc = await Location.findOne({
        _id: parsed.data.locationId,
        userId: user._id,
      })
        .select('name')
        .lean()
      if (!loc) return err('Location not found', 404)
      matchQuery.locationId = loc._id
      businessName = loc.name
    } else {
      // Multi-location: use first location name
      const firstLoc = await Location.findOne({ userId: user._id }).select('name').lean()
      if (firstLoc) businessName = firstLoc.name
    }

    const reviews = await Review.find(matchQuery)
      .select('rating comment sentiment')
      .sort({ reviewCreatedAt: -1 })
      .limit(100)
      .lean()

    if (reviews.length < 3) {
      return ok({
        themes: null,
        message: 'Need at least 3 reviews from the last 30 days to generate insights.',
      })
    }

    const themes = await analyzeCustomerThemes(
      reviews.map((r) => ({
        rating: r.rating,
        comment: r.comment || '',
        sentiment: r.sentiment,
      })),
      businessName
    )

    return ok({ themes, reviewCount: reviews.length })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    console.error('customer-themes:', e)
    return err('Failed to analyse themes', 500)
  }
}
