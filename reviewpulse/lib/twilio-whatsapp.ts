import twilio from 'twilio'
import { getTwilioStatusCallbackUrl, isTwilioWhatsAppConfigured } from '@/lib/twilio-config'

const MAX_BODY = 1550

function truncateBody(body: string): string {
  if (body.length <= MAX_BODY) return body
  return `${body.slice(0, MAX_BODY - 20)}… [truncated]`
}

/**
 * Twilio WhatsApp sends require `from: whatsapp:+E164`. A plain `+1…` is treated as SMS and fails with
 * "could not find a Channel with the specified From address".
 */
export function normalizeTwilioWhatsAppFrom(raw: string): string {
  const inner = raw.trim().replace(/^whatsapp:/i, '').replace(/\s+/g, '')
  const e164 = inner.startsWith('+') ? inner : `+${inner.replace(/^\+/, '')}`
  return `whatsapp:${e164}`
}

function isMessagingServiceSid(s: string): boolean {
  return /^MG[a-f0-9]{32}$/i.test(s.trim())
}

/** Strip whatsapp: prefix; caller should save E.164 (+…) in DB. */
export function normalizeWhatsAppDestination(raw: string): string {
  const s = raw.trim().replace(/^whatsapp:/i, '').replace(/\s+/g, '')
  return s.startsWith('+') ? s : `+${s.replace(/^\+/, '')}`
}

function channelHintForTwilioError(message: string): string {
  if (!/channel|from address/i.test(message)) return message
  return `${message} — For WhatsApp use TWILIO_WHATSAPP_FROM=whatsapp:+14155238886 (sandbox) or your Twilio WhatsApp sender; plain +1… without the whatsapp: prefix will not work.`
}

export async function sendWhatsAppMessage(toE164: string, body: string): Promise<{ sid?: string; error?: string }> {
  if (!isTwilioWhatsAppConfigured()) {
    return { error: 'Twilio not configured' }
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  const fromRaw = process.env.TWILIO_WHATSAPP_FROM!.trim()
  const client = twilio(sid, token)

  const to = normalizeWhatsAppDestination(toE164)
  const toAddress = `whatsapp:${to.replace(/^whatsapp:/i, '')}`
  const statusCallback = getTwilioStatusCallbackUrl()

  const payload: {
    to: string
    body: string
    statusCallback?: string
    from?: string
    messagingServiceSid?: string
  } = {
    to: toAddress,
    body: truncateBody(body),
    ...(statusCallback ? { statusCallback } : {}),
  }

  if (isMessagingServiceSid(fromRaw)) {
    payload.messagingServiceSid = fromRaw
  } else {
    payload.from = normalizeTwilioWhatsAppFrom(fromRaw)
  }

  try {
    const msg = await client.messages.create(payload)
    return { sid: msg.sid }
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Twilio send failed'
    console.error('Twilio WhatsApp error:', errMsg)
    return { error: channelHintForTwilioError(errMsg) }
  }
}

/**
 * B4 / Content API — WhatsApp template (Content SID `HX…`). Do not pass `body` when using this.
 * Template variables use string keys per Twilio (often `"1"`, `"2"`).
 */
export async function sendWhatsAppContentMessage(
  toE164: string,
  contentSid: string,
  contentVariables: Record<string, string>
): Promise<{ sid?: string; error?: string }> {
  if (!isTwilioWhatsAppConfigured()) {
    return { error: 'Twilio not configured' }
  }
  const trimmed = contentSid.trim()
  if (!trimmed.startsWith('HX')) {
    return { error: 'contentSid must be a Twilio Content SID (HX…)' }
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  const fromRaw = process.env.TWILIO_WHATSAPP_FROM!.trim()
  const client = twilio(sid, token)

  const to = normalizeWhatsAppDestination(toE164)
  const toAddress = `whatsapp:${to.replace(/^whatsapp:/i, '')}`
  const statusCallback = getTwilioStatusCallbackUrl()

  const payload: Record<string, string | undefined> = {
    to: toAddress,
    contentSid: trimmed,
    contentVariables: JSON.stringify(contentVariables),
    ...(statusCallback ? { statusCallback } : {}),
  }

  if (isMessagingServiceSid(fromRaw)) {
    payload.messagingServiceSid = fromRaw
  } else {
    payload.from = normalizeTwilioWhatsAppFrom(fromRaw)
  }

  try {
    const msg = await client.messages.create(payload as never)
    return { sid: msg.sid }
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Twilio send failed'
    console.error('Twilio WhatsApp Content error:', errMsg)
    return { error: channelHintForTwilioError(errMsg) }
  }
}

/** Prefer `TWILIO_WHATSAPP_ALERT_CONTENT_SID` (variable `1` = full alert text) when set. */
export async function sendWhatsAppAlertWithOptionalContent(
  toE164: string,
  body: string
): Promise<{ sid?: string; error?: string }> {
  const hx = process.env.TWILIO_WHATSAPP_ALERT_CONTENT_SID?.trim()
  if (hx?.startsWith('HX')) {
    const r = await sendWhatsAppContentMessage(toE164, hx, { '1': body.slice(0, 1000) })
    if (!r.error) return r
  }
  return sendWhatsAppMessage(toE164, body)
}
