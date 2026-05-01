import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { buildHighlightReelManifest, clipsFromReviews } from '@/lib/highlight-reel'
import { planAllowsV2IntelligencePack } from '@/lib/plan-access'
import Location from '@/models/Location'
import Review from '@/models/Review'
import mongoose from 'mongoose'

/** F1 — build highlight reel JSON manifest from recent 5★ reviews. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (!planAllowsV2IntelligencePack(String(user.plan || ''))) {
      return err('Growth or Scale required.', 403)
    }
    await connectDB()
    const { id } = await params
    const location = await Location.findOne({ _id: id, userId: user._id })
    if (!location) return err('Location not found', 404)

    const locId = new mongoose.Types.ObjectId(String(location._id))
    const rows = await Review.find({ locationId: locId, rating: { $gte: 5 } })
      .sort({ reviewCreatedAt: -1 })
      .limit(20)
      .select('reviewerName rating comment')
      .lean()

    const clips = clipsFromReviews(rows)
    const manifest = buildHighlightReelManifest({
      locationName: location.name,
      locationSlug: location.locationSlug || undefined,
      clips,
    })
    location.highlightReelManifestJson = JSON.stringify(manifest)
    location.highlightReelGeneratedAt = new Date()
    await location.save()

    return ok({ manifest })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed', 500)
  }
}
