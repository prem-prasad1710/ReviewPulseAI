export interface PlaceReviewSnippet {
  author_name?: string
  rating?: number
  text?: string
  time?: number
}

export interface PlaceDetailsResult {
  name?: string
  formatted_address?: string
  reviews?: PlaceReviewSnippet[]
}

export async function fetchPlaceDetailsWithReviews(
  placeId: string
): Promise<PlaceDetailsResult | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY
  if (!key) {
    console.error('places-details: missing GOOGLE_PLACES_API_KEY')
    return null
  }
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('fields', 'name,formatted_address,reviews')
  url.searchParams.set('key', key)

  const res = await fetch(url.toString())
  if (!res.ok) return null
  const data = (await res.json()) as {
    status: string
    result?: PlaceDetailsResult
    error_message?: string
  }
  if (data.status !== 'OK' || !data.result) {
    console.error('places-details:', data.status, data.error_message)
    return null
  }
  return data.result
}
