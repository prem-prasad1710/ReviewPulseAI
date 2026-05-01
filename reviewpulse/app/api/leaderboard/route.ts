import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { planAllowsV2IntelligencePack } from '@/lib/plan-access'
import Location from '@/models/Location'

/** C5 — rank outlets on this account by avg rating × log(reviews). */
export async function GET() {
  try {
    const user = await requireAuth()
    if (!planAllowsV2IntelligencePack(String(user.plan || ''))) {
      return err('Growth or Scale required for leaderboard.', 403)
    }
    await connectDB()
    const rows = await Location.find({ userId: user._id, isActive: true })
      .select('name averageRating totalReviews locationSlug')
      .lean()

    const scored = rows.map((r) => {
      const tr = Math.max(1, r.totalReviews || 0)
      const ar = r.averageRating || 0
      const score = ar * Math.log10(tr + 1)
      return {
        id: String(r._id),
        name: r.name,
        averageRating: ar,
        totalReviews: r.totalReviews || 0,
        locationSlug: r.locationSlug,
        score: Math.round(score * 100) / 100,
      }
    })
    scored.sort((a, b) => b.score - a.score)
    return ok({ leaderboard: scored })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed', 500)
  }
}
