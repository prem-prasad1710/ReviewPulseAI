import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import Location from '@/models/Location'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params
    const location = await Location.findOne({ _id: id, userId: user._id }).lean()
    if (!location) return err('Location not found', 404)
    return ok({ ...location, viewerPlan: user.plan })
  } catch (error) {
    console.error('GET /api/locations/[id] failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load location', 500)
  }
}
