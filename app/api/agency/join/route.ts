import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import Agency from '@/models/Agency'
import User from '@/models/User'

const postSchema = z.object({
  inviteToken: z.string().min(8),
})

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) return err('Invalid token', 400)

    await connectDB()
    const agency = await Agency.findOne({ inviteToken: parsed.data.inviteToken })
    if (!agency) return err('Invalid or expired invite', 404)

    await User.findByIdAndUpdate(user._id, { $set: { agencyId: agency._id } })
    await Agency.findByIdAndUpdate(agency._id, { $addToSet: { clientIds: user._id } })

    return ok({ agencyId: String(agency._id), name: agency.name })
  } catch (error) {
    console.error('POST agency/join failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to join agency', 500)
  }
}
