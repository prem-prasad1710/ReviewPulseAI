import type { PlaceDetailsResult, PlaceReviewSnippet } from '@/lib/places-details'
import { competitorPlacesRefreshTtlMs, planAllowsCompetitorSpy } from '@/lib/plan-access'

export const MAX_CACHED_PLACE_REVIEWS = 8

export type CachedPlaceReviewSnippet = Pick<
  PlaceReviewSnippet,
  'author_name' | 'rating' | 'text' | 'time'
>

export type CompetitorPlacesSnapshotFields = {
  placesSnapshotFetchedAt: Date
  placeRating?: number
  previousRating?: number
  placeUserRatingsTotal?: number
  cachedReviewSnippets: CachedPlaceReviewSnippet[]
}

export function buildSnapshotFromPlaceDetails(
  details: PlaceDetailsResult | null,
  existingRating?: number
): CompetitorPlacesSnapshotFields | null {
  if (!details) return null
  const reviews = (details.reviews || []).slice(0, MAX_CACHED_PLACE_REVIEWS)
  const newRating = typeof details.rating === 'number' ? details.rating : undefined
  return {
    placesSnapshotFetchedAt: new Date(),
    placeRating: newRating,
    // Preserve old rating so we can compute the delta for Opportunity Alerts
    previousRating: typeof existingRating === 'number' ? existingRating : undefined,
    placeUserRatingsTotal: typeof details.user_ratings_total === 'number' ? details.user_ratings_total : undefined,
    cachedReviewSnippets: reviews.map((r) => ({
      author_name: r.author_name,
      rating: r.rating,
      text: r.text,
      time: r.time,
    })),
  }
}

export function isCompetitorPlacesSnapshotStale(fetchedAt: Date | undefined, plan: string): boolean {
  if (!fetchedAt) return true
  if (!planAllowsCompetitorSpy(plan)) return false
  const ttl = competitorPlacesRefreshTtlMs(plan)
  if (!Number.isFinite(ttl)) return false
  return Date.now() - fetchedAt.getTime() > ttl
}

export function reviewTextsFromSnippets(snippets: CachedPlaceReviewSnippet[] | undefined): string[] {
  return (snippets || []).map((r) => r.text || '').filter(Boolean)
}
