import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { planAllowsMoodHeatmap } from '@/lib/plan-access'
import Location from '@/models/Location'
import Review from '@/models/Review'
import mongoose from 'mongoose'

const IST = 'Asia/Kolkata'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params

    const plan = String(user.plan || '')
    if (!planAllowsMoodHeatmap(plan)) {
      return err('Upgrade to Growth or Scale to unlock the mood heatmap.', 403)
    }

    const location = await Location.findOne({ _id: id, userId: user._id }).select('_id totalReviews').lean()
    if (!location) return err('Location not found', 404)

    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const locId = new mongoose.Types.ObjectId(String(location._id))

    const pipeline = [
      {
        $match: {
          locationId: locId,
          reviewCreatedAt: { $gte: ninetyDaysAgo },
        },
      },
      {
        $project: {
          hour: { $hour: { date: '$reviewCreatedAt', timezone: IST } },
          dayOfWeek: { $dayOfWeek: { date: '$reviewCreatedAt', timezone: IST } },
          sentimentScore: 1,
          rating: 1,
        },
      },
      {
        $group: {
          _id: { dayOfWeek: '$dayOfWeek', hour: '$hour' },
          avgSentiment: { $avg: '$sentimentScore' },
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]

    const cells = await Review.aggregate(pipeline as mongoose.PipelineStage[])

    const total = await Review.countDocuments({
      locationId: locId,
      reviewCreatedAt: { $gte: ninetyDaysAgo },
    })

    return ok({
      cells,
      totalReviewsInWindow: total,
      minReviewsToUnlock: 50,
      planOk: true,
    })
  } catch (error) {
    console.error('GET heatmap failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load heatmap', 500)
  }
}
