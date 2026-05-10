import type { Session } from 'next-auth'
import { auth } from '@/lib/auth'
import { AUTH_DISABLED_FOR_DEV } from '@/lib/auth-dev'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

async function firstUserLean() {
  await connectDB()
  return User.findOne().sort({ createdAt: 1 }).lean()
}

/** Session for UI: respects dev auth bypass. */
export async function getAppSession(): Promise<Session | null> {
  if (AUTH_DISABLED_FOR_DEV) {
    const u = await firstUserLean()
    const expires = new Date(Date.now() + 7 * 86400000).toISOString()
    if (u) {
      return {
        expires,
        user: {
          id: String(u._id),
          email: u.email,
          name: u.name,
          image: u.image ?? null,
          plan: u.plan,
        },
      }
    }
    return {
      expires,
      user: {
        id: '',
        email: null,
        name: 'Developer',
        image: null,
        plan: 'free',
      },
    }
  }
  return auth()
}

export async function requireAuth() {
  if (AUTH_DISABLED_FOR_DEV) {
    const user = await firstUserLean()
    if (!user) throw new Error('UNAUTHORIZED')
    return user
  }

  const session = await auth()
  if (!session?.user?.id) throw new Error('UNAUTHORIZED')

  await connectDB()
  const user = await User.findById(session.user.id).lean()
  if (!user) throw new Error('USER_NOT_FOUND')

  return user
}
