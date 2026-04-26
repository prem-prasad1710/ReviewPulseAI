import twilio from 'twilio'

export async function sendWhatsAppMessage(toE164: string, body: string): Promise<{ sid?: string; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM
  if (!sid || !token || !from) {
    return { error: 'Twilio not configured' }
  }
  const client = twilio(sid, token)
  try {
    const msg = await client.messages.create({
      from,
      to: `whatsapp:${toE164.replace(/^whatsapp:/, '')}`,
      body,
    })
    return { sid: msg.sid }
  } catch (e) {
    const err = e instanceof Error ? e.message : 'Twilio send failed'
    console.error('Twilio WhatsApp error:', err)
    return { error: err }
  }
}
