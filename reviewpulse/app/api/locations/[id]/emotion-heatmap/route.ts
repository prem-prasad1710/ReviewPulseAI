import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { planAllowsMoodHeatmap } from '@/lib/plan-access'
import Location from '@/models/Location'
import Review from '@/models/Review'
import mongoose from 'mongoose'

/** A1 — emotion counts in last 90 days (IST window via stored UTC dates). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params
    const plan = String(user.plan || '')
    if (!planAllowsMoodHeatmap(plan)) {
      return err('Upgrade to Growth or Scale for emotion heatmap.', 403)
    }

    const location = await Location.findOne({ _id: id, userId: user._id }).select('_id').lean()
    if (!location) return err('Location not found', 404)

    const since = new Date()
    since.setDate(since.getDate() - 90)
    const locId = new mongoose.Types.ObjectId(String(location._id))

    const rows = await Review.aggregate([
      { $match: { locationId: locId, reviewCreatedAt: { $gte: since }, emotion: { $exists: true, $ne: null } } },
      { $group: { _id: '$emotion', count: { $sum: 1 } } },
    ])

    const byEmotion: Record<string, number> = {}
    for (const r of rows as { _id: string; count: number }[]) {
      byEmotion[r._id] = r.count
    }

    return ok({ byEmotion, windowDays: 90 })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed', 500)
  }
}
