import { randomBytes } from 'crypto'
import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { planAllowsSurveys } from '@/lib/plan-access'
import Location from '@/models/Location'
import Survey from '@/models/Survey'

const createSchema = z.object({
  title: z.string().min(2).max(120),
  questions: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1).max(200),
        type: z.enum(['text', 'rating']),
      })
    )
    .min(1)
    .max(12),
})

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (!planAllowsSurveys(String(user.plan || ''))) return err('Growth+ required for surveys.', 403)
    await connectDB()
    const { id } = await params
    const loc = await Location.findOne({ _id: id, userId: user._id }).select('_id').lean()
    if (!loc) return err('Location not found', 404)
    const list = await Survey.find({ locationId: loc._id }).sort({ updatedAt: -1 }).lean()
    return ok({ surveys: list })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed', 500)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (!planAllowsSurveys(String(user.plan || ''))) return err('Growth+ required for surveys.', 403)
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)
    await connectDB()
    const { id } = await params
    const loc = await Location.findOne({ _id: id, userId: user._id }).select('_id').lean()
    if (!loc) return err('Location not found', 404)

    const slug = `sv-${randomBytes(10).toString('hex')}`
    const doc = await Survey.create({
      userId: user._id,
      locationId: loc._id,
      title: parsed.data.title,
      slug,
      questions: parsed.data.questions,
      active: true,
    })
    return ok({ survey: doc.toObject() })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed', 500)
  }
}
