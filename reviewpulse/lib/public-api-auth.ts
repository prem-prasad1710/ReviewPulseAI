import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { randomBytes } from 'crypto'

export const API_KEY_PREFIX = 'rp_live_'

export function generatePublicApiKey(): string {
  return `${API_KEY_PREFIX}${randomBytes(24).toString('base64url')}`
}

export async function findUserIdByPublicApiKey(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.toLowerCase().startsWith('bearer ')) return null
  const token = authHeader.slice(7).trim()
  if (!token.startsWith(API_KEY_PREFIX)) return null
  await connectDB()
  const u = await User.findOne({ publicApiKey: token }).select('_id').lean()
  return u ? String(u._id) : null
}
