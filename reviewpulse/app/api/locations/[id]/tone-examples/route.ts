import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { planAllowsToneTrainer } from '@/lib/plan-access'
import Location from '@/models/Location'

const putSchema = z.object({
  examples: z.array(z.string()).max(10),
})

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params
    const location = await Location.findOne({ _id: id, userId: user._id }).select('toneExamples name').lean()
    if (!location) return err('Location not found', 404)
    return ok({ examples: location.toneExamples || [], planOk: planAllowsToneTrainer(user.plan as string) })
  } catch (error) {
    console.error('GET tone-examples failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load', 500)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (!planAllowsToneTrainer(user.plan as string)) {
      return err('Upgrade your plan to use Tone Trainer (Growth or Scale).', 403)
    }
    const body = await request.json()
    const parsed = putSchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)
    await connectDB()
    const { id } = await params
    const location = await Location.findOneAndUpdate(
      { _id: id, userId: user._id },
      { $set: { toneExamples: parsed.data.examples.slice(0, 10) } },
      { new: true }
    ).lean()
    if (!location) return err('Location not found', 404)
    return ok({ examples: location.toneExamples })
  } catch (error) {
    console.error('PUT tone-examples failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to save', 500)
  }
}
