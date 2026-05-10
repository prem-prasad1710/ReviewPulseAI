import type { Types } from 'mongoose'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { syncLocationReviewsForUser } from '@/lib/sync-location-reviews'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()

    const { id } = await params
    const result = await syncLocationReviewsForUser(user._id as Types.ObjectId, id)
    if (!result.ok) {
      const status = result.status ?? 500
      if (status === 404) return err(result.error, 404)
      return err(result.error, status)
    }

    return ok({ syncedReviews: result.syncedReviews })
  } catch (error) {
    console.error('POST /api/locations/[id]/sync failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to sync reviews', 500)
  }
}
