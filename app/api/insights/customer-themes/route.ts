import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { analyzeCustomerThemes, type CustomerThemesStatus } from '@/lib/customer-themes'
import { connectDB } from '@/lib/mongodb'
import Location from '@/models/Location'
import Review from '@/models/Review'

const qSchema = z.object({
  locationId: z.string().optional(),
})

function aiConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim())
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    await connectDB()

    const url = new URL(request.url)
    const parsed = qSchema.safeParse({ locationId: url.searchParams.get('locationId') ?? undefined })
    if (!parsed.success) return err('Invalid query', 400)

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const matchQuery: Record<string, unknown> = { userId: user._id }
    const recentMatchQuery: Record<string, unknown> = {
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
      recentMatchQuery.locationId = loc._id
      businessName = loc.name
    } else {
      const firstLoc = await Location.findOne({ userId: user._id }).select('name').lean()
      if (firstLoc) businessName = firstLoc.name
    }

    const [totalReviewCount, recentReviews] = await Promise.all([
      Review.countDocuments(matchQuery),
      Review.find(recentMatchQuery)
        .select('rating comment sentiment reviewCreatedAt')
        .sort({ reviewCreatedAt: -1 })
        .limit(100)
        .lean(),
    ])

    const recentCount = recentReviews.length

    if (totalReviewCount === 0) {
      return ok({
        themes: null,
        status: 'no_reviews' satisfies CustomerThemesStatus,
        message: 'No reviews synced yet. Connect Google Business Profile and sync reviews to unlock theme analysis.',
        reviewCount: 0,
        recentReviewCount: 0,
      })
    }

    if (recentCount === 0) {
      return ok({
        themes: null,
        status: 'no_recent_reviews' satisfies CustomerThemesStatus,
        message: 'No reviews in the last 30 days. New customer feedback will appear here automatically after sync.',
        reviewCount: totalReviewCount,
        recentReviewCount: 0,
      })
    }

    if (recentCount < 3) {
      return ok({
        themes: null,
        status: 'insufficient_reviews' satisfies CustomerThemesStatus,
        message: `Only ${recentCount} review${recentCount === 1 ? '' : 's'} in the last 30 days. We need at least 3 to extract reliable themes.`,
        reviewCount: totalReviewCount,
        recentReviewCount: recentCount,
      })
    }

    const withText = recentReviews.filter((r) => (r.comment || '').trim().length > 0)
    if (withText.length < 3) {
      return ok({
        themes: null,
        status: 'no_review_text' satisfies CustomerThemesStatus,
        message:
          'Recent reviews are mostly star ratings without written comments. Themes need a few reviews with text to analyse.',
        reviewCount: totalReviewCount,
        recentReviewCount: recentCount,
      })
    }

    if (!aiConfigured()) {
      return ok({
        themes: null,
        status: 'analysis_unavailable' satisfies CustomerThemesStatus,
        message: 'AI theme analysis is not configured on this server yet. Your reviews are synced — check back once AI keys are added.',
        reviewCount: totalReviewCount,
        recentReviewCount: recentCount,
      })
    }

    const themes = await analyzeCustomerThemes(
      withText.map((r) => ({
        rating: r.rating,
        comment: r.comment || '',
        sentiment: r.sentiment,
      })),
      businessName
    )

    if (!themes) {
      return ok({
        themes: null,
        status: 'analysis_unavailable' satisfies CustomerThemesStatus,
        message: 'Could not generate themes right now. Your reviews are saved — tap refresh to try again in a moment.',
        reviewCount: totalReviewCount,
        recentReviewCount: recentCount,
      })
    }

    return ok({
      themes,
      status: 'ready' satisfies CustomerThemesStatus,
      message: null,
      reviewCount: totalReviewCount,
      recentReviewCount: recentCount,
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    console.error('customer-themes:', e)
    return err('Failed to load customer themes', 500)
  }
}
