import { randomBytes } from 'crypto'
import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { slugifyLocationName } from '@/lib/location-slug'
import { connectDB } from '@/lib/mongodb'
import Agency from '@/models/Agency'

const bodySchema = z.object({
  name: z.string().min(2).max(120),
})

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    if ((user.plan as string) !== 'agency') {
      return err('Agency workspace requires the Agency plan.', 403)
    }
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    await connectDB()
    const existing = await Agency.findOne({ ownerId: user._id }).lean()
    if (existing) return ok({ agency: existing, created: false })

    const slug = `${slugifyLocationName(parsed.data.name)}-${randomBytes(4).toString('hex')}`
    const inviteToken = randomBytes(20).toString('hex')

    const agency = await Agency.create({
      ownerId: user._id,
      name: parsed.data.name,
      slug,
      inviteToken,
      clientIds: [],
      plan: 'agency',
    })

    return ok({ agency, created: true })
  } catch (error) {
    console.error('POST agency/bootstrap failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to create agency', 500)
  }
}
