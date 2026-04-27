import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import Location from '@/models/Location'

const putSchema = z.object({
  googlePlaceId: z.string().min(5).max(256).optional(),
  logoUrl: z.string().url().max(2000).optional().or(z.literal('')),
  festiveAutoMode: z.boolean().optional(),
})

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = putSchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)
    await connectDB()
    const { id } = await params
    const $set: Record<string, string | boolean | undefined> = {}
    if (parsed.data.googlePlaceId !== undefined) $set.googlePlaceId = parsed.data.googlePlaceId
    if (parsed.data.logoUrl !== undefined) $set.logoUrl = parsed.data.logoUrl || undefined
    if (parsed.data.festiveAutoMode !== undefined) $set.festiveAutoMode = parsed.data.festiveAutoMode

    const location = await Location.findOneAndUpdate(
      { _id: id, userId: user._id },
      { $set },
      { new: true }
    )
      .select('googlePlaceId logoUrl name festiveAutoMode')
      .lean()
    if (!location) return err('Location not found', 404)
    return ok(location)
  } catch (error) {
    console.error('PUT location meta failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to save', 500)
  }
}
