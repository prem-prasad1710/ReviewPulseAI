import { z } from 'zod'
import mongoose from 'mongoose'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { extractPlaceIdFromMapsUrl } from '@/lib/extract-place-id'
import { fetchPlaceDetailsWithReviews } from '@/lib/places-details'
import { competitorLimitForPlan, planAllowsCompetitorSpy } from '@/lib/plan-access'
import Competitor from '@/models/Competitor'
import Location from '@/models/Location'

const postSchema = z.object({
  mapsUrl: z.string().optional(),
  placeId: z.string().optional(),
})

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params
    const location = await Location.findOne({ _id: id, userId: user._id }).select('_id').lean()
    if (!location) return err('Location not found', 404)
    const list = await Competitor.find({ locationId: id, userId: user._id }).sort({ createdAt: -1 }).lean()
    return ok({
      competitors: list,
      planOk: planAllowsCompetitorSpy(user.plan as string),
      limit: competitorLimitForPlan(user.plan as string),
    })
  } catch (error) {
    console.error('GET competitors failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load', 500)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (!planAllowsCompetitorSpy(user.plan as string)) {
      return err('Competitor Review Spy is available on Scale plan only.', 403)
    }
    const body = await request.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)
    const placeId =
      parsed.data.placeId?.trim() ||
      (parsed.data.mapsUrl ? extractPlaceIdFromMapsUrl(parsed.data.mapsUrl) : null)
    if (!placeId) return err('Could not resolve Google Place ID from URL', 400)

    await connectDB()
    const { id } = await params
    const location = await Location.findOne({ _id: id, userId: user._id })
    if (!location) return err('Location not found', 404)

    const limit = competitorLimitForPlan(user.plan as string)
    const count = await Competitor.countDocuments({ locationId: location._id, userId: user._id })
    if (count >= limit) return err(`Maximum ${limit} competitors for your plan.`, 400)

    const details = await fetchPlaceDetailsWithReviews(placeId)
    const name = details?.name || 'Competitor'
    const address = details?.formatted_address

    const doc = await Competitor.findOneAndUpdate(
      { locationId: location._id, placeId },
      {
        $set: {
          userId: user._id,
          name,
          address,
        },
        $setOnInsert: { themes: { positive: [], negative: [] } },
      },
      { upsert: true, new: true }
    ).lean()

    return ok({ competitor: doc })
  } catch (error) {
    console.error('POST competitors failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
      return err('This competitor is already added.', 400)
    }
    return err('Failed to add competitor', 500)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { searchParams } = new URL(request.url)
    const cid = searchParams.get('competitorId')
    if (!cid) return err('competitorId required', 400)
    const { id } = await params
    const res = await Competitor.deleteOne({ _id: cid, locationId: id, userId: user._id })
    if (res.deletedCount === 0) return err('Not found', 404)
    return ok({ deleted: true })
  } catch (error) {
    console.error('DELETE competitors failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to delete', 500)
  }
}
