/**
 * Seed MongoDB with sample locations + reviews for E2E testing.
 *
 * Usage (from repo root, with MONGODB_URI in .env):
 *   SEED_USER_EMAIL=you@gmail.com npm run seed:test
 *
 * Optional:
 *   SEED_SKIP_PLAN_UPGRADE=true   — do not change user.plan (stays free / current)
 *   SEED_PLAN=growth              — default is scale (unlocks competitor spy, etc.)
 *
 * After upgrading plan via seed, sign out and sign back in so the session JWT picks up the new plan.
 */
import path from 'node:path'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(path.resolve(process.cwd()))

async function main() {
  const email = process.env.SEED_USER_EMAIL?.trim()
  if (!email) {
    console.error('Missing SEED_USER_EMAIL. Example: SEED_USER_EMAIL=you@gmail.com npm run seed:test')
    process.exit(1)
  }

  const { seedTestDataForUserEmail } = await import('../lib/seed-test-data')
  const result = await seedTestDataForUserEmail(email, {
    upgradePlan: process.env.SEED_SKIP_PLAN_UPGRADE !== 'true',
    plan: process.env.SEED_PLAN === 'growth' ? 'growth' : 'scale',
  })

  console.log(JSON.stringify(result, null, 2))
  console.info('\nIf your plan was upgraded: sign out and sign in again so the app shows Growth/Scale features.\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
