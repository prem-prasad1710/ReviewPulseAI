import { signIn } from '@/lib/auth'

/**
 * Starts Google OAuth with Business Profile scope and returns to /locations.
 * Prefer this over linking to /api/auth/signin/google so the flow matches the login page (NextAuth v5).
 */
export async function GET() {
  await signIn('google', { redirectTo: '/locations' })
}
