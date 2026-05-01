/** F1 — JSON manifest for a “highlight reel” (e.g. Remotion / external editor). */

import type { Types } from 'mongoose'

export type HighlightClip = {
  reviewerName: string
  rating: number
  quote: string
  reviewId: string
}

export function buildHighlightReelManifest(input: {
  locationName: string
  locationSlug?: string
  clips: HighlightClip[]
}): { version: 1; generatedAt: string; locationName: string; locationSlug?: string; clips: HighlightClip[] } {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    locationName: input.locationName,
    locationSlug: input.locationSlug,
    clips: input.clips,
  }
}

export function clipsFromReviews(
  rows: Array<{ _id: Types.ObjectId | string; reviewerName: string; rating: number; comment?: string }>
): HighlightClip[] {
  return rows
    .filter((r) => r.rating >= 5 && (r.comment || '').trim().length > 8)
    .slice(0, 8)
    .map((r) => ({
      reviewId: String(r._id),
      reviewerName: r.reviewerName,
      rating: r.rating,
      quote: (r.comment || '').slice(0, 160),
    }))
}
