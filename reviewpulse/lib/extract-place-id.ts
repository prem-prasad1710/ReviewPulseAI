/** Extract Google Place ID from a Maps URL. */
export function extractPlaceIdFromMapsUrl(url: string): string | null {
  const trimmed = url.trim()
  const placeIdParam = trimmed.match(/[?&]place_id=([^&]+)/i)
  if (placeIdParam?.[1]) return decodeURIComponent(placeIdParam[1])
  const bang = trimmed.match(/!1s([^!]+)/)
  if (bang?.[1]) return decodeURIComponent(bang[1].replace(/\+/g, ' '))
  const dataPid = trimmed.match(/data=.*?1s([a-zA-Z0-9_-]+)/)
  if (dataPid?.[1] && dataPid[1].startsWith('ChIJ')) return dataPid[1]
  return null
}
