import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { planAllowsV2IntelligencePack } from '@/lib/plan-access'
import Location from '@/models/Location'
import Review from '@/models/Review'
import mongoose from 'mongoose'

/** F2 — reviewers with multiple 5★ reviews for this outlet. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params
    if (!planAllowsV2IntelligencePack(String(user.plan || ''))) {
      return err('Growth or Scale required.', 403)
    }
    const loc = await Location.findOne({ _id: id, userId: user._id }).select('_id name').lean()
    if (!loc) return err('Location not found', 404)
    const locId = new mongoose.Types.ObjectId(String(loc._id))

    const rows = await Review.aggregate([
      { $match: { locationId: locId, rating: { $gte: 5 } } },
      { $group: { _id: '$reviewerName', count: { $sum: 1 }, lastAt: { $max: '$reviewCreatedAt' } } },
      { $match: { count: { $gte: 2 } } },
      { $sort: { count: -1 } },
      { $limit: 25 },
    ])

    return ok({ superfans: rows })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed', 500)
  }
}
