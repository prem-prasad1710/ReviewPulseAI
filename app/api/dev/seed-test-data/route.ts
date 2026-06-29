import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { seedTestDataForUserId } from '@/lib/seed-test-data'

/**
 * Loads synthetic locations, reviews, competitors, and staff mentions (prefix `rp-seed-`).
 * Blocked in production. Set ALLOW_DEV_SEED=true locally.
 * Body: { "purgeAll": true } removes every location/review for the signed-in user first.
 */
export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return err('Not available', 404)
    }
    if (process.env.ALLOW_DEV_SEED !== 'true') {
      return err('Set ALLOW_DEV_SEED=true in .env to enable.', 403)
    }
    const body = (await request.json().catch(() => ({}))) as { purgeAll?: boolean }
    const user = await requireAuth()
    const id = String(user._id)
    const plan = process.env.SEED_PLAN === 'growth' ? 'growth' : 'scale'
    const result = await seedTestDataForUserId(id, {
      upgradePlan: process.env.SEED_SKIP_PLAN_UPGRADE === 'true' ? false : true,
      plan,
      purgeAll: body.purgeAll === true,
    })
    return ok(result)
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    const msg = e instanceof Error ? e.message : 'Failed'
    return err(msg, 500)
  }
}
