import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { planAllowsStaffTracker } from '@/lib/plan-access'
import Location from '@/models/Location'
import StaffMention from '@/models/StaffMention'
import mongoose from 'mongoose'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const staffName = searchParams.get('staffName')
    const parsed = z.string().min(1).max(120).safeParse(staffName ?? '')
    if (!parsed.success) return err('staffName required', 400)

    const plan = String(user.plan || '')
    if (!planAllowsStaffTracker(plan)) {
      return err('Upgrade to Growth or Scale for staff insights.', 403)
    }

    const location = await Location.findOne({ _id: id, userId: user._id }).select('_id').lean()
    if (!location) return err('Location not found', 404)

    const locId = new mongoose.Types.ObjectId(String(location._id))

    const quotes = await StaffMention.find({
      locationId: locId,
      userId: user._id,
      staffName: parsed.data,
      isStaff: true,
    })
      .sort({ reviewDate: -1 })
      .limit(80)
      .select('quote sentiment reviewDate reviewId')
      .lean()

    return ok({ quotes })
  } catch (error) {
    console.error('GET staff-quotes failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load quotes', 500)
  }
}
