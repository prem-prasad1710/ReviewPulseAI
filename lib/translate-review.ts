import { getGoogleTranslateApiKey } from '@/lib/google-api-keys'
import { allowGoogleTranslateForUser } from '@/lib/google-api-guards'

/**
 * Cloud Translation REST v2 — API key is appended server-side only (never sent to browsers).
 */
export async function translateToEnglish(
  text: string,
  sourceIso1: string,
  options: { userIdForQuota: string }
): Promise<string | null> {
  const key = getGoogleTranslateApiKey()
  if (!key || sourceIso1 === 'en' || text.length <= 10) return null

  if (!(await allowGoogleTranslateForUser(options.userIdForQuota))) {
    console.warn('Google Translate skipped: rate limited')
    return null
  }

  const url = new URL('https://translation.googleapis.com/language/translate/v2')
  url.searchParams.set('key', key)
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: text,
      source: sourceIso1,
      target: 'en',
      format: 'text',
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('Google Translate error:', res.status, body.slice(0, 300))
    return null
  }
  const data = (await res.json()) as {
    data?: { translations?: Array<{ translatedText?: string }> }
  }
  const out = data.data?.translations?.[0]?.translatedText
  return out ?? null
}
