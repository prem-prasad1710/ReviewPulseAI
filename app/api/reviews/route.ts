import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { MOCK_REVIEWS, shouldUseDashboardMocks } from '@/lib/dev-mock-dashboard'
import { connectDB } from '@/lib/mongodb'
import Review from '@/models/Review'

const querySchema = z.object({
  status: z.enum(['pending', 'replied', 'ignored', 'scheduled']).optional(),
  locationId: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    await connectDB()

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()))

    if (!parsed.success) return err('Invalid query params', 400)

    if (shouldUseDashboardMocks()) {
      let list = MOCK_REVIEWS.map((r) => ({ ...r }))
      if (parsed.data.status) list = list.filter((r) => r.status === parsed.data.status)
      if (parsed.data.locationId) list = list.filter((r) => r.locationId === parsed.data.locationId)
      return ok(list)
    }

    const filter: Record<string, unknown> = { userId: user._id }
    if (parsed.data.status) filter.status = parsed.data.status
    if (parsed.data.locationId) filter.locationId = parsed.data.locationId

    const reviews = await Review.find(filter).sort({ reviewCreatedAt: -1 }).lean()
    return ok(reviews)
  } catch (error) {
    console.error('GET /api/reviews failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to fetch reviews', 500)
  }
}
