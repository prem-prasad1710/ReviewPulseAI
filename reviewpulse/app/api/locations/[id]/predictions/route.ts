import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { predictReviewRisk } from '@/lib/review-prediction'
import { planAllowsV2IntelligencePack } from '@/lib/plan-access'
import Location from '@/models/Location'
import Review from '@/models/Review'
import mongoose from 'mongoose'

/** A2 — churn / escalation risk for recent reviews. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params
    if (!planAllowsV2IntelligencePack(String(user.plan || ''))) {
      return err('Growth or Scale required.', 403)
    }
    const loc = await Location.findOne({ _id: id, userId: user._id }).select('_id').lean()
    if (!loc) return err('Location not found', 404)
    const locId = new mongoose.Types.ObjectId(String(loc._id))

    const since = new Date()
    since.setDate(since.getDate() - 60)

    const recent = await Review.find({
      locationId: locId,
      reviewCreatedAt: { $gte: since },
    })
      .select('rating comment sentimentScore reviewerName status')
      .sort({ reviewCreatedAt: -1 })
      .limit(40)
      .lean()

    const scored = recent.map((r) => ({
      id: String(r._id),
      reviewerName: r.reviewerName,
      rating: r.rating,
      status: r.status,
      ...predictReviewRisk({
        rating: r.rating,
        comment: r.comment || '',
        sentimentScore: r.sentimentScore ?? 0,
      }),
    }))

    const high = scored.filter((s) => s.tier === 'high').length
    return ok({ samples: scored, highRiskCount: high, windowDays: 60 })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed', 500)
  }
}
