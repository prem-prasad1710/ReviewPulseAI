import twilio from 'twilio'
import { getTwilioStatusCallbackUrl, isTwilioWhatsAppConfigured } from '@/lib/twilio-config'

const MAX_BODY = 1550

function truncateBody(body: string): string {
  if (body.length <= MAX_BODY) return body
  return `${body.slice(0, MAX_BODY - 20)}… [truncated]`
}

/** Strip whatsapp: prefix; caller should save E.164 (+…) in DB. */
export function normalizeWhatsAppDestination(raw: string): string {
  const s = raw.trim().replace(/^whatsapp:/i, '').replace(/\s+/g, '')
  return s.startsWith('+') ? s : `+${s.replace(/^\+/, '')}`
}

export async function sendWhatsAppMessage(toE164: string, body: string): Promise<{ sid?: string; error?: string }> {
  if (!isTwilioWhatsAppConfigured()) {
    return { error: 'Twilio not configured' }
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  const from = process.env.TWILIO_WHATSAPP_FROM!
  const client = twilio(sid, token)

  const to = normalizeWhatsAppDestination(toE164)
  const statusCallback = getTwilioStatusCallbackUrl()

  try {
    const msg = await client.messages.create({
      from,
      to: `whatsapp:${to.replace(/^whatsapp:/i, '')}`,
      body: truncateBody(body),
      ...(statusCallback ? { statusCallback } : {}),
    })
    return { sid: msg.sid }
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Twilio send failed'
    console.error('Twilio WhatsApp error:', errMsg)
    return { error: errMsg }
  }
}
