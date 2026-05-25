import { createHmac, randomBytes } from 'node:crypto'

/**
 * Outbound Zapier/partner webhook (PDF: webhook triggers for new reviews).
 */
export async function deliverPartnerReviewWebhook(opts: {
  url: string
  secret?: string | null
  event: 'review.new'
  payload: Record<string, unknown>
}): Promise<{ ok: boolean; status?: number }> {
  const bodyObj = {
    event: opts.event,
    timestamp: new Date().toISOString(),
    nonce: randomBytes(8).toString('hex'),
    data: opts.payload,
  }
  const body = JSON.stringify(bodyObj)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'ReviewPulse-Webhooks/1.0',
  }
  if (opts.secret?.trim()) {
    const sig = createHmac('sha256', opts.secret.trim()).update(body).digest('hex')
    headers['X-ReviewPulse-Signature'] = sig
    headers['X-ReviewPulse-Signature-Alg'] = 'HMAC-SHA256'
  }
  try {
    const res = await fetch(opts.url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10000),
    })
    return { ok: res.ok, status: res.status }
  } catch {
    return { ok: false }
  }
}
