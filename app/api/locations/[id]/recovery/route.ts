import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import Location from '@/models/Location'
import Review from '@/models/Review'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params

    const location = await Location.findOne({ _id: id, userId: user._id })
      .select('name locationSlug')
      .lean()
    if (!location) return err('Location not found', 404)

    // All 1–2★ reviews for this location
    const negativeReviews = await Review.find({
      locationId: location._id,
      userId: user._id,
      rating: { $in: [1, 2] },
    })
      .sort({ reviewCreatedAt: -1 })
      .limit(100)
      .select('_id reviewerName rating comment status sentiment reviewCreatedAt publishedReply locationId')
      .lean()

    const needsReply = negativeReviews
      .filter((r) => r.status === 'pending' || r.status === 'ignored')
      .map((r) => ({
        id: String(r._id),
        reviewerName: r.reviewerName,
        rating: r.rating,
        comment: r.comment || '',
        status: r.status,
        sentiment: r.sentiment,
        reviewCreatedAt: r.reviewCreatedAt.toISOString(),
        publishedReply: r.publishedReply,
        locationId: String(r.locationId),
      }))

    const monitoring = negativeReviews
      .filter((r) => r.status === 'replied')
      .map((r) => ({
        id: String(r._id),
        reviewerName: r.reviewerName,
        rating: r.rating,
        comment: r.comment || '',
        status: r.status,
        sentiment: r.sentiment,
        reviewCreatedAt: r.reviewCreatedAt.toISOString(),
        publishedReply: r.publishedReply,
        locationId: String(r.locationId),
      }))

    const totalNegative = negativeReviews.length
    const replied = negativeReviews.filter((r) => r.status === 'replied').length
    const recoveryRate = totalNegative > 0 ? Math.round((replied / totalNegative) * 100) : 0

    return ok({
      location: {
        name: location.name,
        locationSlug: (location as { locationSlug?: string }).locationSlug ?? '',
      },
      needsReply,
      monitoring,
      totalNegative,
      replied,
      recoveryRate,
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    console.error('GET /api/locations/[id]/recovery failed:', e)
    return err('Failed to load recovery data', 500)
  }
}
