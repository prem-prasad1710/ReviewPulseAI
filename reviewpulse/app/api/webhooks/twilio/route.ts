import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { connectDB } from '@/lib/mongodb'
import { planAllowsWhatsAppDigestBot } from '@/lib/plan-access'
import { handleWhatsAppDigestCommand } from '@/lib/twilio-whatsapp-commands'
import { tryConsumeWhatsAppBotSlot } from '@/lib/twilio-whatsapp-bot-limit'
import { shouldVerifyTwilioWebhookSignature, webhookUrlForSignatureValidation } from '@/lib/twilio-config'
import { normalizeWhatsAppDestination } from '@/lib/twilio-whatsapp'
import User from '@/models/User'

function twimlMessage(body: string): NextResponse {
  const twiml = new twilio.twiml.MessagingResponse()
  twiml.message(body.slice(0, 1500))
  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  })
}

/**
 * Twilio webhooks:
 * - Status callbacks (MessageStatus) for outbound WhatsApp
 * - Inbound WhatsApp (B1 digest bot): text commands → TwiML reply
 */
export async function GET() {
  return new NextResponse('ok', { status: 200, headers: { 'Content-Type': 'text/plain' } })
}

export async function POST(request: Request) {
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const rawBody = await request.text()
  const params: Record<string, string> = {}
  for (const [k, v] of new URLSearchParams(rawBody)) {
    params[k] = v
  }

  const signature = request.headers.get('x-twilio-signature') || ''
  const url = webhookUrlForSignatureValidation(request)

  if (shouldVerifyTwilioWebhookSignature() && authToken) {
    const valid = twilio.validateRequest(authToken, signature, url, params)
    if (!valid) {
      console.warn('Twilio webhook: signature validation failed for', url)
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  const messageStatus = params.MessageStatus
  const messageSid = params.MessageSid || params.SmsSid
  const errorCode = params.ErrorCode

  if (messageStatus) {
    if (messageStatus === 'failed' || messageStatus === 'undelivered') {
      console.error('Twilio message issue:', { messageSid, messageStatus, errorCode, to: params.To })
    } else if (process.env.NODE_ENV === 'development') {
      console.info('Twilio status:', { messageSid, messageStatus })
    }
    return new NextResponse(null, { status: 204 })
  }

  const body = params.Body?.trim() || ''
  const from = params.From

  if (from && (body.length > 0 || params.ButtonPayload)) {
    const cmd = (params.ButtonPayload || body).trim()
    if (!cmd) {
      return twimlMessage('Send *help* for ReviewPulse commands.')
    }

    try {
      await connectDB()
      const fromNorm = normalizeWhatsAppDestination(from)
      const user = await User.findOne({ whatsappNumber: fromNorm }).lean()
      if (!user) {
        return twimlMessage('Number not linked to ReviewPulse. Save your WhatsApp in Settings → WhatsApp alerts.')
      }
      const plan = (user.plan as string) || 'free'
      if (!planAllowsWhatsAppDigestBot(plan)) {
        return twimlMessage('WhatsApp commands need a paid plan. Upgrade in Settings → Billing.')
      }
      const allowed = await tryConsumeWhatsAppBotSlot(user._id as import('mongoose').Types.ObjectId)
      if (!allowed) {
        return twimlMessage('Daily command limit reached (50). Try again tomorrow or use the web app.')
      }
      const reply = await handleWhatsAppDigestCommand(user._id as import('mongoose').Types.ObjectId, cmd)
      return twimlMessage(reply)
    } catch (e) {
      console.error('Twilio inbound bot failed:', e)
      return twimlMessage('Something went wrong. Open the web app or try again later.')
    }
  }

  return new NextResponse(null, { status: 204 })
}
