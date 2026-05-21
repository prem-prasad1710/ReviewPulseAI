/**
 * Server-side Google Maps Platform / Cloud Translation keys only.
 * Never use NEXT_PUBLIC_* for these — keys must stay on the server.
 */
export function getGooglePlacesApiKey(): string | undefined {
  const k = process.env.GOOGLE_PLACES_API_KEY?.trim()
  return k || undefined
}

/** Used for Static Maps proxy and legacy Places fallback when Places key is omitted. */
export function getGoogleMapsApiKey(): string | undefined {
  const k = process.env.GOOGLE_MAPS_API_KEY?.trim()
  return k || undefined
}

/** Resolves Places Details calls: prefers dedicated Places SKU key, falls back to Maps key. */
export function getGooglePlacesOrMapsKey(): string | undefined {
  return getGooglePlacesApiKey() || getGoogleMapsApiKey()
}

export function getGoogleTranslateApiKey(): string | undefined {
  const k = process.env.GOOGLE_TRANSLATE_API_KEY?.trim()
  return k || undefined
}
