import { err, ok } from '@/lib/api'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

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

    return ok({ success: true, ranAt: now.toISOString() })
  } catch (error) {
    console.error('POST /api/cron/sync-reviews failed:', error)
    return err('Cron failed', 500)
  }
}
