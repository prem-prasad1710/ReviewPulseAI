import { extractMapsPlaceTitleSlug, extractMapsViewportLatLng, extractPlaceIdFromMapsUrl } from '@/lib/extract-place-id'
import { getGooglePlacesOrMapsKey } from '@/lib/google-api-keys'

/** Hosts we're willing to GET for short-link expansion (SSRF mitigation). */
function isTrustedMapsHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return (
    h === 'maps.app.goo.gl' ||
    h === 'goo.gl' ||
    h.endsWith('.goo.gl') ||
    h === 'maps.google.com' ||
    h === 'www.google.com' ||
    h === 'google.com' ||
    (h.endsWith('.google.com') && !h.endsWith('@google.com'))
  )
}

async function expandShortMapsLinksIfNeeded(url: string): Promise<string> {
  let trimmed = url.trim()
  if (!/^https?:\/\//i.test(trimmed)) trimmed = `https://${trimmed}`

  let host: string
  try {
    host = new URL(trimmed).hostname.toLowerCase()
  } catch {
    return trimmed
  }

  if (!(host.includes('goo.gl') || host === 'maps.app.goo.gl')) {
    return trimmed
  }

  if (!isTrustedMapsHost(host)) return trimmed

  try {
    const res = await fetch(trimmed, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(7500),
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        // Some CDNs behave better with a common UA string
        'User-Agent': 'Mozilla/5.0 (compatible; ReviewPulse/1)',
      },
    })
    try {
      const finalUrl = res.url || trimmed
      if (finalUrl && /^https:\/\//i.test(finalUrl)) {
        const u = new URL(finalUrl)
        if (/\/maps/i.test(u.pathname) || u.search.includes('maps')) return finalUrl
      }
    } catch {
      /* keep trimmed */
    }
  } catch {
    /* Offline / transient — caller still tries Find Place */
  }

  return trimmed
}

/**
 * Canonical Place Details ID (e.g. `ChIJ…`) from paste, or resolves via Places Find Place from Text using
 * the `/maps/place/Slug/` fragment and optional map coordinates when share links only embed CAD-style IDs.
 */
export async function extractOrResolvePlaceIdFromMapsUrl(mapsUrl: string): Promise<string | null> {
  const expanded = await expandShortMapsLinksIfNeeded(mapsUrl.trim())

  const direct = extractPlaceIdFromMapsUrl(expanded)
  if (direct) return direct

  const apiKey = getGooglePlacesOrMapsKey()
  if (!apiKey) return null

  const slug = extractMapsPlaceTitleSlug(expanded)
  if (!slug) return null

  const params = new URLSearchParams({
    input: slug,
    inputtype: 'textquery',
    fields: 'place_id',
    key: apiKey,
  })

  const ll = extractMapsViewportLatLng(expanded)
  if (ll) {
    params.set('locationbias', `circle:${ll.lat},${ll.lng}|2200`)
  }

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${params.toString()}`,
    { next: { revalidate: 0 } }
  )
  if (!res.ok) {
    console.error('findplacefromtext:', res.status)
    return null
  }

  const data = (await res.json()) as {
    status: string
    candidates?: Array<{ place_id?: string }>
    error_message?: string
  }

  if (data.status !== 'OK') {
    if (data.status !== 'ZERO_RESULTS') {
      console.error('findplacefromtext:', data.status, data.error_message || '')
    }
    return null
  }

  const pid = data.candidates?.[0]?.place_id
  return pid?.trim() || null
}
