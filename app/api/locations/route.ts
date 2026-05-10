import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { encrypt } from '@/lib/crypto'
import { defaultAlertKeywordsForCategory } from '@/lib/default-keywords'
import { effectiveLocationLimit } from '@/lib/plans'
import type { IUserLean } from '@/types'
import Location from '@/models/Location'

const bodySchema = z.object({
  googleLocationId: z.string().min(1),
  googleAccountId: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().optional(),
  category: z.string().optional(),
  googlePlaceId: z.string().optional(),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  tokenExpiresAt: z.string().datetime(),
})

export async function GET() {
  try {
    const user = await requireAuth()
    await connectDB()

    const locations = await Location.find({ userId: user._id, isActive: true }).sort({ createdAt: -1 }).lean()
    return ok(locations)
  } catch (error) {
    console.error('GET /api/locations failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to fetch locations', 500)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    await connectDB()

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    const existing = await Location.findOne({
      userId: user._id,
      googleLocationId: parsed.data.googleLocationId,
    }).select('_id').lean()
    if (!existing) {
      const count = await Location.countDocuments({ userId: user._id, isActive: true })
      const limit = effectiveLocationLimit(user as unknown as IUserLean)
      if (count >= limit) {
        return err(`Location limit (${limit}) reached for your plan.`, 403)
      }
    }

    const keywordDefaults = defaultAlertKeywordsForCategory(parsed.data.category)

    const location = await Location.findOneAndUpdate(
      { userId: user._id, googleLocationId: parsed.data.googleLocationId },
      {
        $set: {
          googleAccountId: parsed.data.googleAccountId,
          name: parsed.data.name,
          address: parsed.data.address,
          phone: parsed.data.phone,
          category: parsed.data.category,
          googlePlaceId: parsed.data.googlePlaceId,
          accessToken: encrypt(parsed.data.accessToken),
          refreshToken: encrypt(parsed.data.refreshToken),
          tokenExpiresAt: new Date(parsed.data.tokenExpiresAt),
          isActive: true,
        },
        $setOnInsert: {
          qrScans: 0,
          ...(keywordDefaults.length ? { alertKeywords: keywordDefaults } : {}),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    return ok(location)
  } catch (error) {
    console.error('POST /api/locations failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to save location', 500)
  }
}
