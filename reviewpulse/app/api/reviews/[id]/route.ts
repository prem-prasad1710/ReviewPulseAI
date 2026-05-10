import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import {
  planAllowsReviewAutopsy,
  planAllowsSocialPostFull,
  planAllowsFakeScore,
} from '@/lib/plan-access'
import Location from '@/models/Location'
import Review from '@/models/Review'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params

    const review = await Review.findOne({ _id: id, userId: user._id }).lean()
    if (!review) return err('Review not found', 404)

    const location = await Location.findOne({ _id: review.locationId, userId: user._id })
      .select('name category festiveAutoMode googlePlaceId googleAccountId googleLocationId')
      .lean()

    const plan = user.plan as string

    return ok({
      review,
      location: location
        ? {
            name: location.name,
            category: location.category,
            festiveAutoMode: location.festiveAutoMode !== false,
            googlePlaceId: location.googlePlaceId,
          }
        : null,
      gates: {
        autopsy: planAllowsReviewAutopsy(plan),
        socialFull: planAllowsSocialPostFull(plan),
        fakeScore: planAllowsFakeScore(plan),
      },
    })
  } catch (error) {
    console.error('GET /api/reviews/[id] failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load review', 500)
  }
}
