import type { Types } from 'mongoose'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { syncAllLimiter } from '@/lib/rate-limit'
import { syncLocationReviewsForUser } from '@/lib/sync-location-reviews'
import Location from '@/models/Location'

export type SyncAllResultRow = {
  id: string
  name: string
  syncedReviews?: number
  error?: string
}

export async function POST() {
  try {
    const user = await requireAuth()
    await connectDB()

    if (syncAllLimiter) {
      const { success } = await syncAllLimiter.limit(`u:${String(user._id)}`)
      if (!success) {
        return err('Too many sync-all requests. Try again in an hour.', 429)
      }
    }

    const uid = user._id as Types.ObjectId
    const locations = await Location.find({ userId: uid, isActive: true }).sort({ createdAt: -1 }).lean()

    const results: SyncAllResultRow[] = []
    let totalReviews = 0

    for (const loc of locations) {
      const id = String(loc._id)
      const name = loc.name || 'Location'
      const outcome = await syncLocationReviewsForUser(uid, id)
      if (outcome.ok) {
        totalReviews += outcome.syncedReviews
        results.push({ id, name, syncedReviews: outcome.syncedReviews })
      } else {
        results.push({ id, name, error: outcome.error })
      }
    }

    return ok({
      locations: locations.length,
      results,
      totalReviewsSynced: totalReviews,
    })
  } catch (error) {
    console.error('POST /api/locations/sync-all failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to sync all locations', 500)
  }
}
