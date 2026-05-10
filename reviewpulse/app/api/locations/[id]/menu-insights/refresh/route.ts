import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { planAllowsMenuInsights } from '@/lib/plan-access'
import { runMenuInsightsForLocation } from '@/lib/run-menu-insights'
import Location from '@/models/Location'
import mongoose from 'mongoose'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params

    const plan = String(user.plan || '')
    if (!planAllowsMenuInsights(plan)) {
      return err('Menu insights are available on the Scale plan.', 403)
    }

    const location = await Location.findOne({ _id: id, userId: user._id }).select('menuInsightsManualAt').lean()
    if (!location) return err('Location not found', 404)

    const last = location.menuInsightsManualAt ? new Date(location.menuInsightsManualAt).getTime() : 0
    if (last && Date.now() - last < SEVEN_DAYS_MS) {
      return err('You can refresh menu insights once every 7 days.', 429)
    }

    const oid = new mongoose.Types.ObjectId(String(id))
    await runMenuInsightsForLocation(oid)
    await Location.findByIdAndUpdate(oid, { $set: { menuInsightsManualAt: new Date() } })

    return ok({ refreshed: true })
  } catch (error) {
    console.error('POST menu-insights refresh failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Refresh failed', 500)
  }
}
