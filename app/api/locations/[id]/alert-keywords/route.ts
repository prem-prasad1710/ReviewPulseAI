import { z } from 'zod'
import mongoose from 'mongoose'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { planAllowsKeywordAlerts } from '@/lib/plan-access'
import Location from '@/models/Location'
import ReviewAlert from '@/models/ReviewAlert'

const keywordSchema = z.object({
  keyword: z.string().min(1).max(120),
  type: z.enum(['crisis', 'positive']),
  enabled: z.boolean().optional().default(true),
})

const putSchema = z.object({
  keywords: z.array(keywordSchema),
})

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params
    const location = await Location.findOne({ _id: id, userId: user._id }).select('alertKeywords name').lean()
    if (!location) return err('Location not found', 404)

    const since = new Date()
    since.setDate(since.getDate() - 30)
    const alerts = await ReviewAlert.find({
      locationId: new mongoose.Types.ObjectId(id),
      userId: user._id,
      createdAt: { $gte: since },
      type: { $in: ['crisis', 'positive'] },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    return ok({
      keywords: location.alertKeywords || [],
      recentAlerts: alerts,
      planOk: planAllowsKeywordAlerts(user.plan as string),
    })
  } catch (error) {
    console.error('GET alert-keywords failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load', 500)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (!planAllowsKeywordAlerts(user.plan as string)) {
      return err('Upgrade to Growth or Scale for keyword alerts.', 403)
    }
    const body = await request.json()
    const parsed = putSchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)
    await connectDB()
    const { id } = await params
    const normalized = parsed.data.keywords.map((k) => ({
      keyword: k.keyword.trim(),
      type: k.type,
      enabled: k.enabled ?? true,
      createdAt: new Date(),
    }))
    const location = await Location.findOneAndUpdate(
      { _id: id, userId: user._id },
      { $set: { alertKeywords: normalized } },
      { new: true }
    )
      .select('alertKeywords')
      .lean()
    if (!location) return err('Location not found', 404)
    return ok({ keywords: location.alertKeywords })
  } catch (error) {
    console.error('PUT alert-keywords failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to save', 500)
  }
}
