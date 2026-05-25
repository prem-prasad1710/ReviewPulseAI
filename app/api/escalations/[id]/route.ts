import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { isMongoObjectIdString } from '@/lib/utils'
import EscalationTask from '@/models/EscalationTask'

const patchSchema = z.object({
  status: z.enum(['resolved']),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    if (!isMongoObjectIdString(id)) return err('Invalid id', 400)

    const body = await request.json().catch(() => ({}))
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    await connectDB()

    const task = await EscalationTask.findOneAndUpdate(
      { _id: id, userId: user._id },
      { $set: { status: 'resolved', resolvedAt: new Date() } },
      { new: true }
    ).lean()

    if (!task) return err('Escalation not found', 404)
    return ok(task)
  } catch (error) {
    console.error('PATCH escalation failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to update', 500)
  }
}
