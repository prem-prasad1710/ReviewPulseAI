/** Google Cloud Translation REST v2 (API key). */
export async function translateToEnglish(text: string, sourceIso1: string): Promise<string | null> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY
  if (!key || sourceIso1 === 'en' || text.length <= 10) return null

  const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source: sourceIso1, target: 'en', format: 'text' }),
  })
  if (!res.ok) {
    console.error('Google Translate error:', res.status, await res.text())
    return null
  }
  const data = (await res.json()) as {
    data?: { translations?: Array<{ translatedText?: string }> }
  }
  const out = data.data?.translations?.[0]?.translatedText
  return out ?? null
}
