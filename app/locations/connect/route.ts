import { signIn } from '@/lib/auth'

/**
 * Starts Google OAuth with Business Profile scope and returns to /locations.
 * Lives outside `(dashboard)` so production builds don't try to compose this Route Handler with the dashboard layout.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  await signIn('google', { redirectTo: '/locations' })
}
