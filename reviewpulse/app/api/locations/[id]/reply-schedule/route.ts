import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { planAllowsReplyScheduler } from '@/lib/plan-access'
import Location from '@/models/Location'

const putSchema = z.object({
  enabled: z.boolean(),
  startHour: z.number().min(0).max(23),
  endHour: z.number().min(0).max(23),
  workingDays: z.array(z.number().min(0).max(6)).min(1),
  timezone: z.string().min(1),
})

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params
    const location = await Location.findOne({ _id: id, userId: user._id }).select('replySchedule').lean()
    if (!location) return err('Location not found', 404)
    return ok({
      replySchedule: location.replySchedule,
      planOk: planAllowsReplyScheduler(user.plan as string),
    })
  } catch (error) {
    console.error('GET reply-schedule failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load', 500)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (!planAllowsReplyScheduler(user.plan as string)) {
      return err('Upgrade to Growth or Scale for reply scheduling.', 403)
    }
    const body = await request.json()
    const parsed = putSchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)
    await connectDB()
    const { id } = await params
    const location = await Location.findOneAndUpdate(
      { _id: id, userId: user._id },
      { $set: { replySchedule: parsed.data } },
      { new: true }
    )
      .select('replySchedule')
      .lean()
    if (!location) return err('Location not found', 404)
    return ok({ replySchedule: location.replySchedule })
  } catch (error) {
    console.error('PUT reply-schedule failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to save', 500)
  }
}
