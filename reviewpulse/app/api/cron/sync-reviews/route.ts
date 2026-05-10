import type { Types } from 'mongoose'
import { err, ok } from '@/lib/api'
import { connectDB } from '@/lib/mongodb'
import { syncLocationReviewsForUser } from '@/lib/sync-location-reviews'
import Location from '@/models/Location'
import User from '@/models/User'

const DEFAULT_BATCH = 25

/** Vercel Cron invokes with GET; keep POST for manual / external triggers. */
export async function GET(request: Request) {
  return POST(request)
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const secret = process.env.CRON_SECRET

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return err('Unauthorized', 401)
    }

    await connectDB()

    const now = new Date()
    if (now.getUTCDate() === 1) {
      await User.updateMany({}, { $set: { repliesUsedThisMonth: 0, repliesResetAt: new Date() } })
    }

    const batchLimit = Math.min(
      80,
      Math.max(1, Number.parseInt(process.env.CRON_SYNC_BATCH_SIZE || String(DEFAULT_BATCH), 10) || DEFAULT_BATCH)
    )

    const locations = await Location.find({ isActive: true })
      .sort({ lastSyncedAt: 1 })
      .limit(batchLimit)
      .select('_id userId name lastSyncedAt')
      .lean()

    const results: Array<{ locationId: string; ok: boolean; syncedReviews?: number; error?: string }> = []

    for (const loc of locations) {
      const uid = loc.userId as Types.ObjectId
      const id = String(loc._id)
      try {
        const outcome = await syncLocationReviewsForUser(uid, id)
        if (outcome.ok) {
          results.push({ locationId: id, ok: true, syncedReviews: outcome.syncedReviews })
        } else {
          results.push({ locationId: id, ok: false, error: outcome.error })
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Sync error'
        results.push({ locationId: id, ok: false, error: message })
      }
    }

    return ok({
      success: true,
      ranAt: now.toISOString(),
      batchLimit,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('POST /api/cron/sync-reviews failed:', error)
    return err('Cron failed', 500)
  }
}
