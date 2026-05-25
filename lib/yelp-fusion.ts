/**
 * Yelp Fusion v3 reviews (PDF integration spec) — excerpts only (≤3 reviews per Yelp API).
 */

export interface YelpReviewExcerpt {
  rating: number
  text: string
  time_created: string
  user?: { name?: string }
}

export async function fetchYelpBusinessReviews(yelpBusinessId: string): Promise<{
  reviews: YelpReviewExcerpt[]
}> {
  const key = process.env.YELP_API_KEY?.trim()
  if (!key) {
    throw new Error('YELP_API_KEY is not configured')
  }

  const url = `https://api.yelp.com/v3/businesses/${encodeURIComponent(yelpBusinessId)}/reviews`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(12000),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Yelp API ${res.status}: ${txt.slice(0, 200)}`)
  }

  const json = (await res.json()) as {
    reviews?: Array<{
      rating?: number
      text?: string
      time_created?: string
      user?: { name?: string }
    }>
  }
  const reviews = (json.reviews ?? []).map((r) => ({
    rating: r.rating ?? 0,
    text: String(r.text || ''),
    time_created: r.time_created ?? '',
    user: r.user,
  }))
  return { reviews }
}
