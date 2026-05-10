import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { hyperLocalBenchmark } from '@/lib/local-benchmark'
import { planAllowsV2IntelligencePack } from '@/lib/plan-access'
import Location from '@/models/Location'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params
    if (!planAllowsV2IntelligencePack(String(user.plan || ''))) {
      return err('Growth or Scale required for benchmark intelligence.', 403)
    }
    const loc = await Location.findOne({ _id: id, userId: user._id }).select('averageRating totalReviews name').lean()
    if (!loc) return err('Location not found', 404)
    const bench = hyperLocalBenchmark(loc.averageRating || 0, loc.totalReviews || 0)
    return ok({ locationName: loc.name, ...bench })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed', 500)
  }
}
