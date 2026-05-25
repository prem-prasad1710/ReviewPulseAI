import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { fetchYelpBusinessReviews } from '@/lib/yelp-fusion'
import Location from '@/models/Location'

/** Yelp Fusion excerpts (≤3 reviews) — PDF multi-channel roadmap. Requires YELP_API_KEY and Location.yelpBusinessId. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params
    const loc = await Location.findOne({ _id: id, userId: user._id }).select('name yelpBusinessId').lean()
    if (!loc) return err('Location not found', 404)
    if (!loc.yelpBusinessId?.trim()) {
      return err('Set Yelp business id on this location first (Integrations hub).', 400)
    }
    try {
      const result = await fetchYelpBusinessReviews(loc.yelpBusinessId.trim())
      return ok({ locationName: loc.name, reviews: result.reviews, source: 'yelp_fusion' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Yelp unavailable'
      return err(msg, 502)
    }
  } catch (error) {
    console.error('GET yelp-reviews failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load Yelp data', 500)
  }
}
