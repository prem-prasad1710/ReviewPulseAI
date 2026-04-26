import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('UNAUTHORIZED')

  await connectDB()
  const user = await User.findById(session.user.id).lean()
  if (!user) throw new Error('USER_NOT_FOUND')

  return user
}
