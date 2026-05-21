/** True when `!1s…` fragments look like Google's opaque Place IDs (never `0x…:0x…` CAD-style tokens). */
function looksLikePlacesPlaceIdFromBangSegment(encoded: string): string | null {
  let id: string
  try {
    id = decodeURIComponent(encoded.replace(/\+/g, ' ')).trim()
  } catch {
    id = encoded.replace(/\+/g, ' ').trim()
  }
  // Compound feature IDs in share URLs (invalid for Details / Places API resource name)
  if (id.includes(':')) return null
  if (/^0x[0-9a-f]+$/i.test(id)) return null
  // Conservative: alphanumeric + underscore/hyphen, typical opaque place id length
  if (!/^[-A-Za-z0-9_]{10,}$/.test(id)) return null
  return id
}

/** Extract canonical Place ID fragments from Google Maps URLs (won't return `0xf00:0xbaa` CAD tokens). */
export function extractPlaceIdFromMapsUrl(url: string): string | null {
  const trimmed = url.trim()

  const placeIdParam = trimmed.match(/[?&]place_id=([^&]+)/i)
  if (placeIdParam?.[1]) {
    try {
      const decoded = decodeURIComponent(placeIdParam[1])
      if (!decoded.includes(':')) return decoded
    } catch {
      if (!placeIdParam[1].includes(':')) return placeIdParam[1]
    }
  }

  const chijBang = trimmed.match(/!1s(ChIJ[a-zA-Z0-9_-]+)/i)
  if (chijBang?.[1]) return chijBang[1]

  const bang = trimmed.match(/!1s([^!]+)/)
  if (bang?.[1]) {
    const fromBang = looksLikePlacesPlaceIdFromBangSegment(bang[1])
    if (fromBang) return fromBang
  }

  const dataPid = trimmed.match(/data=.*?[!,]1s(ChIJ[a-zA-Z0-9_-]+)/i)
  if (dataPid?.[1]) return dataPid[1]

  return null
}

/** Human-readable slug from `/maps/place/…/` (used for Find Place fallback). */
export function extractMapsPlaceTitleSlug(url: string): string | null {
  try {
    const normalized = /^https?:\/\//i.test(url) ? url.trim() : `https://${url.trim()}`
    const u = new URL(normalized)
    const m = u.pathname.match(/\/maps\/place\/([^/@?]+)/i)
    if (!m?.[1]) return null
    const slug = decodeURIComponent(m[1].replace(/\+/g, ' ')).replace(/\s+/g, ' ').trim()
    return slug.length >= 2 ? slug : null
  } catch {
    return null
  }
}

/** Lat/lng from `@lat,lng` or `@lat,lng,zoom`. */
export function extractMapsViewportLatLng(url: string): { lat: number; lng: number } | null {
  const m = url.match(/@(-?\d+\.\d+|-?\d+),(-?\d+\.\d+|-?\d+)/)
  if (!m?.[1] || !m?.[2]) return null
  const lat = Number(m[1])
  const lng = Number(m[2])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}
