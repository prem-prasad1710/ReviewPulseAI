import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { analyzeBestSendTime, formatRecommendation } from '@/lib/send-time-analyzer'
import Location from '@/models/Location'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params

    const location = await Location.findOne({ _id: id, userId: user._id }).select('_id').lean()
    if (!location) return err('Location not found', 404)

    const result = await analyzeBestSendTime(location._id)
    const recommendation = formatRecommendation(
      result.bestDay,
      result.bestBucket,
      result.bestAvgRating,
      result.confidence
    )

    return ok({ ...result, recommendation })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    console.error('send-time-analysis:', e)
    return err('Failed to analyse', 500)
  }
}
