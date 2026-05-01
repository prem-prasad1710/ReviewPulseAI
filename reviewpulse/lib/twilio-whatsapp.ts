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
