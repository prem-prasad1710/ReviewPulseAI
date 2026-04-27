import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { planAllowsStaffTracker } from '@/lib/plan-access'
import Location from '@/models/Location'
import StaffMention from '@/models/StaffMention'
import mongoose from 'mongoose'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params

    const plan = String(user.plan || '')
    if (!planAllowsStaffTracker(plan)) {
      return err('Upgrade to Growth or Scale for staff insights.', 403)
    }

    const location = await Location.findOne({ _id: id, userId: user._id }).select('_id').lean()
    if (!location) return err('Location not found', 404)

    const locId = new mongoose.Types.ObjectId(String(location._id))

    const rows = await StaffMention.aggregate([
      { $match: { locationId: locId, userId: user._id, isStaff: true } },
      {
        $group: {
          _id: '$staffName',
          positive: { $sum: { $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0] } },
          negative: { $sum: { $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0] } },
          neutral: { $sum: { $cond: [{ $eq: ['$sentiment', 'neutral'] }, 1, 0] } },
          lastMentioned: { $max: '$reviewDate' },
        },
      },
      { $sort: { positive: -1, lastMentioned: -1 } },
    ])

    const withPct = rows.map((r) => {
      const total = r.positive + r.negative + r.neutral
      const pct = total ? Math.round((r.positive / total) * 100) : 0
      return {
        staffName: r._id as string,
        positive: r.positive,
        negative: r.negative,
        neutral: r.neutral,
        sentimentPct: pct,
        lastMentioned: r.lastMentioned,
        total,
      }
    })

    return ok({ rows: withPct })
  } catch (error) {
    console.error('GET staff-tracker failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load staff tracker', 500)
  }
}

const patchSchema = z.object({
  staffName: z.string().min(1).max(120),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params

    const plan = String(user.plan || '')
    if (!planAllowsStaffTracker(plan)) {
      return err('Upgrade to Growth or Scale for staff insights.', 403)
    }

    const location = await Location.findOne({ _id: id, userId: user._id }).select('_id').lean()
    if (!location) return err('Location not found', 404)

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    const locId = new mongoose.Types.ObjectId(String(location._id))

    await StaffMention.updateMany(
      {
        locationId: locId,
        userId: user._id,
        staffName: parsed.data.staffName,
      },
      { $set: { isStaff: false } }
    )

    return ok({ hidden: true })
  } catch (error) {
    console.error('PATCH staff-tracker failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to update', 500)
  }
}
