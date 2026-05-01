import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { brandVoiceConsistencyScore } from '@/lib/brand-voice-score'
import { planAllowsToneTrainer } from '@/lib/plan-access'
import Location from '@/models/Location'
import Review from '@/models/Review'
import mongoose from 'mongoose'

/** D3 — overlap of published replies vs tone examples. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params
    if (!planAllowsToneTrainer(String(user.plan || ''))) {
      return err('Tone trainer (Growth+) required for brand voice score.', 403)
    }
    const loc = await Location.findOne({ _id: id, userId: user._id }).select('toneExamples').lean()
    if (!loc) return err('Location not found', 404)
    const locId = new mongoose.Types.ObjectId(String(id))
    const replies = await Review.find({
      locationId: locId,
      status: 'replied',
      publishedReply: { $exists: true, $ne: '' },
    })
      .select('publishedReply')
      .sort({ repliedAt: -1 })
      .limit(12)
      .lean()
    const texts = replies.map((r) => r.publishedReply || '').filter(Boolean)
    const score = brandVoiceConsistencyScore(texts, (loc.toneExamples as string[]) || [])
    return ok({ score, repliesAnalyzed: texts.length, examples: (loc.toneExamples as string[])?.length || 0 })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed', 500)
  }
}
