import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import Location from '@/models/Location'

const businessTypeEnum = z.enum(['restaurant', 'clinic', 'salon', 'retail', 'hotel', 'gym', 'school', 'other'])
const complianceEnum = z.enum(['standard', 'healthcare', 'legal', 'finance'])

const putSchema = z.object({
  googlePlaceId: z.string().min(5).max(256).optional(),
  logoUrl: z.string().url().max(2000).optional().or(z.literal('')),
  festiveAutoMode: z.boolean().optional(),
  businessType: businessTypeEnum.optional(),
  complianceMode: complianceEnum.optional(),
  crisisMode: z.boolean().optional(),
})

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params
    const location = await Location.findOne({ _id: id, userId: user._id })
      .select(
        'googlePlaceId logoUrl name festiveAutoMode locationSlug businessType complianceMode crisisMode averageRating totalReviews'
      )
      .lean()
    if (!location) return err('Location not found', 404)
    return ok({ ...location, viewerPlan: user.plan })
  } catch (error) {
    console.error('GET location meta failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load', 500)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = putSchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)
    await connectDB()
    const { id } = await params
    const $set: Record<string, string | boolean | undefined> = {}
    if (parsed.data.googlePlaceId !== undefined) $set.googlePlaceId = parsed.data.googlePlaceId
    if (parsed.data.logoUrl !== undefined) $set.logoUrl = parsed.data.logoUrl || undefined
    if (parsed.data.festiveAutoMode !== undefined) $set.festiveAutoMode = parsed.data.festiveAutoMode
    if (parsed.data.businessType !== undefined) $set.businessType = parsed.data.businessType
    if (parsed.data.complianceMode !== undefined) $set.complianceMode = parsed.data.complianceMode
    if (parsed.data.crisisMode !== undefined) $set.crisisMode = parsed.data.crisisMode

    const location = await Location.findOneAndUpdate(
      { _id: id, userId: user._id },
      { $set },
      { new: true }
    )
      .select(
        'googlePlaceId logoUrl name festiveAutoMode locationSlug businessType complianceMode crisisMode averageRating totalReviews'
      )
      .lean()
    if (!location) return err('Location not found', 404)
    return ok({ ...location, viewerPlan: user.plan })
  } catch (error) {
    console.error('PUT location meta failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to save', 500)
  }
}
