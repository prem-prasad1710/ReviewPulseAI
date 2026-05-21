import { getGooglePlacesOrMapsKey } from '@/lib/google-api-keys'
import { allowGooglePlacesGlobal } from '@/lib/google-api-guards'
import { GooglePlacesRateLimitedError } from '@/lib/google-rate-limit-error'

export interface PlaceReviewSnippet {
  author_name?: string
  rating?: number
  text?: string
  time?: number
}

export interface PlaceDetailsResult {
  name?: string
  formatted_address?: string
  rating?: number
  user_ratings_total?: number
  reviews?: PlaceReviewSnippet[]
}

type PlaceReviewNewApi = {
  rating?: number
  text?: { text?: string }
  originalText?: { text?: string }
  authorAttribution?: { displayName?: string }
  publishTime?: string
}

type PlaceDetailsNewApi = {
  displayName?: { text?: string }
  formattedAddress?: string
  rating?: number
  userRatingCount?: number
  reviews?: PlaceReviewNewApi[]
}

function parsePublishTimeUnix(publishTime: string | undefined): number | undefined {
  if (!publishTime) return undefined
  const ms = Date.parse(publishTime)
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : undefined
}

function mapNewApiToLegacy(place: PlaceDetailsNewApi): PlaceDetailsResult {
  const reviews: PlaceReviewSnippet[] = (place.reviews || []).map((r) => ({
    author_name: r.authorAttribution?.displayName,
    rating: r.rating,
    text: r.text?.text || r.originalText?.text || '',
    time: parsePublishTimeUnix(r.publishTime),
  }))
  return {
    name: place.displayName?.text,
    formatted_address: place.formattedAddress,
    rating: place.rating,
    user_ratings_total:
      typeof place.userRatingCount === 'number' ? place.userRatingCount : undefined,
    reviews,
  }
}

async function fetchPlaceDetailsNew(placeId: string, apiKey: string): Promise<PlaceDetailsResult | null> {
  const enc = encodeURIComponent(placeId)
  const url = `https://places.googleapis.com/v1/places/${enc}`
  const fieldMask = [
    'displayName',
    'formattedAddress',
    'rating',
    'userRatingCount',
    'reviews',
  ].join(',')
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
    },
    next: { revalidate: 0 },
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error('places-details (new): HTTP', res.status, errText.slice(0, 200))
    return null
  }
  const data = (await res.json()) as PlaceDetailsNewApi
  const legacy = mapNewApiToLegacy(data)
  return legacy.name || legacy.formatted_address || legacy.reviews?.length ? legacy : null
}

async function fetchPlaceDetailsLegacy(placeId: string, apiKey: string): Promise<PlaceDetailsResult | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('fields', 'name,formatted_address,rating,user_ratings_total,reviews')
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) return null
  const data = (await res.json()) as {
    status: string
    result?: PlaceDetailsResult
    error_message?: string
  }
  if (data.status !== 'OK' || !data.result) {
    console.error('places-details (legacy):', data.status, data.error_message || '')
    return null
  }
  return data.result
}

export async function fetchPlaceDetailsWithReviews(
  placeId: string
): Promise<PlaceDetailsResult | null> {
  const key = getGooglePlacesOrMapsKey()
  if (!key) {
    console.error('places-details: missing GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY')
    return null
  }

  const allowedGlobal = await allowGooglePlacesGlobal()
  if (!allowedGlobal) throw new GooglePlacesRateLimitedError()

  const trimmed = placeId.trim()
  if (!trimmed) return null

  const next = await fetchPlaceDetailsNew(trimmed, key)
  if (next) return next

  return fetchPlaceDetailsLegacy(trimmed, key)
}
