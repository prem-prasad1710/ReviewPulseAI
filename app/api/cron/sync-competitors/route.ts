import { err, ok } from '@/lib/api'
import { connectDB } from '@/lib/mongodb'
import { syncStaleCompetitorPlacesSnapshots } from '@/lib/sync-competitors-snapshot'

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

    const batchLimit = Math.min(
      80,
      Math.max(1, Number.parseInt(process.env.CRON_COMPETITOR_SNAPSHOT_BATCH_SIZE || String(DEFAULT_BATCH), 10) || DEFAULT_BATCH)
    )

    const result = await syncStaleCompetitorPlacesSnapshots(batchLimit)

    return ok({
      success: true,
      ranAt: new Date().toISOString(),
      batchLimit,
      examined: result.examined,
      refreshed: result.refreshed,
      skipped: result.skipped,
      errors: result.errors,
    })
  } catch (error) {
    console.error('POST /api/cron/sync-competitors failed:', error)
    return err('Cron failed', 500)
  }
}
