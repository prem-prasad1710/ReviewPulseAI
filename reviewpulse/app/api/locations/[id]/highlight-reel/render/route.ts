import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { buildHighlightReelManifest, clipsFromReviews } from '@/lib/highlight-reel'
import { renderHighlightReelToMp4Buffer } from '@/lib/remotion-render-reel'
import { planAllowsV2IntelligencePack } from '@/lib/plan-access'
import Location from '@/models/Location'
import Review from '@/models/Review'
import mongoose from 'mongoose'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'
export const maxDuration = 300

type ManifestV1 = {
  version: 1
  locationName: string
  clips: Array<{ reviewerName: string; rating: number; quote: string }>
}

/** F1 — server-side Remotion render → MP4 upload (Vercel Blob). Requires FFmpeg on the host. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (!planAllowsV2IntelligencePack(String(user.plan || ''))) {
      return err('Growth or Scale required.', 403)
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
      return err('Set BLOB_READ_WRITE_TOKEN to store rendered MP4 on Vercel Blob.', 503)
    }

    await connectDB()
    const { id } = await params
    const location = await Location.findOne({ _id: id, userId: user._id })
    if (!location) return err('Location not found', 404)

    let manifest: ManifestV1 | null = null
    if (location.highlightReelManifestJson) {
      try {
        manifest = JSON.parse(location.highlightReelManifestJson) as ManifestV1
      } catch {
        manifest = null
      }
    }

    let clips = manifest?.clips || []
    if (!clips.length) {
      const locId = new mongoose.Types.ObjectId(String(location._id))
      const rows = await Review.find({ locationId: locId, rating: { $gte: 5 } })
        .sort({ reviewCreatedAt: -1 })
        .limit(20)
        .select('reviewerName rating comment')
        .lean()
      clips = clipsFromReviews(rows)
    }

    if (!clips.length) {
      return err('No 5★ clips to render. Sync reviews or generate a manifest first.', 400)
    }

    const title = manifest?.locationName || location.name
    const buffer = await renderHighlightReelToMp4Buffer({
      title,
      clips: clips.map((c) => ({
        reviewerName: c.reviewerName,
        rating: c.rating,
        quote: c.quote,
      })),
    })

    const key = `reels/${id}/${Date.now()}.mp4`
    const blob = await put(key, buffer, {
      access: 'public',
      contentType: 'video/mp4',
    })

    location.highlightReelVideoUrl = blob.url
    if (!location.highlightReelManifestJson) {
      const built = buildHighlightReelManifest({
        locationName: location.name,
        locationSlug: location.locationSlug || undefined,
        clips: clips.map((c) => ({
          reviewId: '',
          reviewerName: c.reviewerName,
          rating: c.rating,
          quote: c.quote,
        })),
      })
      location.highlightReelManifestJson = JSON.stringify(built)
    }
    location.highlightReelGeneratedAt = new Date()
    await location.save()

    return ok({ url: blob.url })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    const msg = e instanceof Error ? e.message : 'Render failed'
    console.error('Highlight reel render:', e)
    return err(
      `${msg} — If FFmpeg is missing locally, install it (brew install ffmpeg). On Vercel serverless, use a worker or Remotion Lambda.`,
      500
    )
  }
}
