import { err, ok } from '@/lib/api'
import { connectDB } from '@/lib/mongodb'
import { findUserIdByPublicApiKey } from '@/lib/public-api-auth'
import Location from '@/models/Location'
import Review from '@/models/Review'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

/** G1 — read-only reviews for a location (Bearer rp_live_…). */
export async function GET(request: Request, { params }: { params: Promise<{ locationId: string }> }) {
  try {
    const uid = await findUserIdByPublicApiKey(request.headers.get('authorization'))
    if (!uid) return err('Unauthorized — use Authorization: Bearer rp_live_…', 401)
    await connectDB()
    const { locationId } = await params
    let locOid: mongoose.Types.ObjectId
    try {
      locOid = new mongoose.Types.ObjectId(locationId)
    } catch {
      return err('Invalid location id', 400)
    }
    const loc = await Location.findOne({ _id: locOid, userId: new mongoose.Types.ObjectId(uid) })
      .select('_id name')
      .lean()
    if (!loc) return err('Location not found', 404)

    const reviews = await Review.find({ locationId: loc._id })
      .sort({ reviewCreatedAt: -1 })
      .limit(50)
      .select('reviewerName rating comment reviewCreatedAt status')
      .lean()

    return ok({ location: { id: String(loc._id), name: loc.name }, reviews })
  } catch {
    return err('Failed', 500)
  }
}
