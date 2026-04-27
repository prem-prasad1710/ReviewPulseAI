import { err, ok } from '@/lib/api'
import { connectDB } from '@/lib/mongodb'
import { runMenuInsightsForLocation } from '@/lib/run-menu-insights'
import Location from '@/models/Location'
import User from '@/models/User'

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
    const scaleUsers = await User.find({ plan: 'scale' }).select('_id').lean()
    const ids = scaleUsers.map((u) => u._id)
    if (ids.length === 0) return ok({ processed: 0 })

    const locations = await Location.find({ userId: { $in: ids } }).select('_id').lean()
    let n = 0
    for (const loc of locations) {
      try {
        await runMenuInsightsForLocation(loc._id)
        n++
      } catch (e) {
        console.error('menu-insights cron location failed:', loc._id, e)
      }
    }

    return ok({ processed: n, ranAt: new Date().toISOString() })
  } catch (error) {
    console.error('POST /api/cron/menu-insights failed:', error)
    return err('Cron failed', 500)
  }
}
