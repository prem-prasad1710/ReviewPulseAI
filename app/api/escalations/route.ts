import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import EscalationTask from '@/models/EscalationTask'

export async function GET() {
  try {
    const user = await requireAuth()
    await connectDB()
    const rows = await EscalationTask.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(120)
      .populate('reviewId', 'rating comment reviewerName reviewCreatedAt googleReviewId')
      .populate('locationId', 'name')
      .lean()
    return ok(rows)
  } catch (error) {
    console.error('GET escalations failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load escalations', 500)
  }
}
