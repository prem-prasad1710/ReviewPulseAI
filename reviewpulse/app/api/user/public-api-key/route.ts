import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { generatePublicApiKey } from '@/lib/public-api-auth'
import { planAllowsPublicRestApi } from '@/lib/plan-access'
import User from '@/models/User'

/** G1 — create or rotate public API key (shown once). */
export async function POST() {
  try {
    const user = await requireAuth()
    if (!planAllowsPublicRestApi(String(user.plan || ''))) {
      return err('Growth or Scale required for public API keys.', 403)
    }
    await connectDB()
    const key = generatePublicApiKey()
    await User.findByIdAndUpdate(user._id, { $set: { publicApiKey: key } })
    return ok({ apiKey: key, hint: 'Store safely — it will not be shown again.' })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed', 500)
  }
}

export async function GET() {
  try {
    const user = await requireAuth()
    await connectDB()
    const u = await User.findById(user._id).select('publicApiKey').lean()
    const masked = u?.publicApiKey
      ? `${u.publicApiKey.slice(0, 10)}…${u.publicApiKey.slice(-4)}`
      : null
    return ok({ hasKey: Boolean(u?.publicApiKey), masked, planOk: planAllowsPublicRestApi(String(user.plan || '')) })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed', 500)
  }
}
