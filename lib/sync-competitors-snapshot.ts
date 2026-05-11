import type { Types } from 'mongoose'
import { buildSnapshotFromPlaceDetails, isCompetitorPlacesSnapshotStale } from '@/lib/competitor-places-snapshot'
import { connectDB } from '@/lib/mongodb'
import { fetchPlaceDetailsWithReviews } from '@/lib/places-details'
import { planAllowsCompetitorSpy } from '@/lib/plan-access'
import Competitor from '@/models/Competitor'
import User from '@/models/User'

const DEFAULT_BATCH = 25

export type RefreshCompetitorSnapshotOutcome =
  | { ok: true; refreshed: boolean }
  | { ok: false; error: string }

/**
 * One Google Places Details call → persist snapshot on the Competitor doc.
 * Used when adding a competitor (user action) and from cron for stale rows.
 */
export async function refreshCompetitorPlacesSnapshot(
  competitorId: Types.ObjectId | string,
  userPlan: string
): Promise<RefreshCompetitorSnapshotOutcome> {
  if (!planAllowsCompetitorSpy(userPlan)) {
    return { ok: false, error: 'plan' }
  }

  await connectDB()
  const c = await Competitor.findById(competitorId)
  if (!c) return { ok: false, error: 'not_found' }

  const details = await fetchPlaceDetailsWithReviews(c.placeId)
  const snap = buildSnapshotFromPlaceDetails(details)
  if (!snap) return { ok: false, error: 'places_unavailable' }

  if (details?.name) c.name = details.name
  if (details?.formatted_address) c.address = details.formatted_address
  c.placesSnapshotFetchedAt = snap.placesSnapshotFetchedAt
  c.placeRating = snap.placeRating
  c.placeUserRatingsTotal = snap.placeUserRatingsTotal
  c.cachedReviewSnippets = snap.cachedReviewSnippets
  await c.save()

  return { ok: true, refreshed: true }
}

export type SyncStaleCompetitorsResult = {
  examined: number
  refreshed: number
  skipped: number
  errors: number
}

/**
 * Batch-refresh competitor Place snapshots that are past TTL for the owner’s plan.
 * Intended for cron only — keeps Places spend predictable.
 */
export async function syncStaleCompetitorPlacesSnapshots(
  batchLimit = DEFAULT_BATCH
): Promise<SyncStaleCompetitorsResult> {
  await connectDB()
  const limit = Math.min(120, Math.max(1, batchLimit))

  const candidates = await Competitor.find({})
    .sort({ placesSnapshotFetchedAt: 1 })
    .limit(Math.min(200, limit * 8))
    .lean()

  let examined = 0
  let refreshed = 0
  let skipped = 0
  let errors = 0

  for (const row of candidates) {
    if (refreshed >= limit) break
    examined += 1

    const user = await User.findById(row.userId).select('plan').lean()
    const plan = String(user?.plan || 'free')
    if (!planAllowsCompetitorSpy(plan)) {
      skipped += 1
      continue
    }

    const fetched = row.placesSnapshotFetchedAt ? new Date(row.placesSnapshotFetchedAt) : undefined
    if (!isCompetitorPlacesSnapshotStale(fetched, plan)) {
      skipped += 1
      continue
    }

    const out = await refreshCompetitorPlacesSnapshot(String(row._id), plan)
    if (out.ok) refreshed += 1
    else errors += 1
  }

  return { examined, refreshed, skipped, errors }
}
