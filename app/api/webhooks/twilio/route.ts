import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { connectDB } from '@/lib/mongodb'
import { planAllowsWhatsAppDigestBot } from '@/lib/plan-access'
import { handleWhatsAppDigestCommand } from '@/lib/twilio-whatsapp-commands'
import { tryConsumeWhatsAppBotSlot } from '@/lib/twilio-whatsapp-bot-limit'
import { shouldVerifyTwilioWebhookSignature, webhookUrlForSignatureValidation } from '@/lib/twilio-config'
import { twimlMessageFromContentTemplate } from '@/lib/twilio-twiml-content'
import { normalizeWhatsAppDestination } from '@/lib/twilio-whatsapp'
import {
  handleInboundVoiceNote,
  handleVoicePinTextCommand,
  tryHandleVoiceDraftConfirmOrCancel,
} from '@/lib/whatsapp-voice-reply'
import User from '@/models/User'

function twimlMessage(body: string): NextResponse {
  const twiml = new twilio.twiml.MessagingResponse()
  twiml.message(body.slice(0, 1500))
  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  })
}

function replyWithOptionalContent(body: string): NextResponse {
  const contentSid = process.env.TWILIO_WHATSAPP_DIGEST_REPLY_CONTENT_SID?.trim()
  if (contentSid?.startsWith('HX')) {
    return twimlMessageFromContentTemplate(contentSid, body)
  }
  return twimlMessage(body)
}

/**
 * Twilio webhooks:
 * - Status callbacks (MessageStatus) for outbound WhatsApp
 * - Inbound WhatsApp (B1 digest bot): text commands → TwiML reply
 * - 9.1 Voice reply: audio → Whisper + draft; *haan* / *yes* → publish to GBP
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
  const numMedia = Math.min(5, Math.max(0, parseInt(params.NumMedia || '0', 10) || 0))

  /** Voice / audio note (WhatsApp sends MediaUrl0 + often empty Body). */
  if (from && numMedia > 0) {
    const mediaUrl = params.MediaUrl0
    const mediaType = params.MediaContentType0 || ''
    if (!mediaUrl) {
      return new NextResponse(null, { status: 204 })
    }
    const looksAudio = /^audio\//i.test(mediaType) || /\.(ogg|opus|amr|mp3|m4a|webm)(\?|$)/i.test(mediaUrl)
    if (!looksAudio) {
      return twimlMessage('Send a *voice note* for ReviewPulse, or text *help* for commands.')
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
        return twimlMessage('WhatsApp features need a paid plan. Upgrade in Settings → Billing.')
      }
      const msg = await handleInboundVoiceNote({
        userId: user._id as import('mongoose').Types.ObjectId,
        mediaUrl,
        mediaContentType: mediaType,
      })
      return replyWithOptionalContent(msg)
    } catch (e) {
      console.error('Twilio inbound voice failed:', e)
      return twimlMessage('Voice reply failed. Try the web inbox or again later.')
    }
  }

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

      const uid = user._id as import('mongoose').Types.ObjectId

      const voiceConfirm = await tryHandleVoiceDraftConfirmOrCancel(uid, cmd)
      if (voiceConfirm !== null) {
        return replyWithOptionalContent(voiceConfirm)
      }

      const voiceCmd = await handleVoicePinTextCommand(uid, cmd)
      if (voiceCmd !== null) {
        const allowed = await tryConsumeWhatsAppBotSlot(uid)
        if (!allowed) {
          return twimlMessage('Daily command limit reached (50). Try again tomorrow or use the web app.')
        }
        return replyWithOptionalContent(voiceCmd)
      }

      const allowed = await tryConsumeWhatsAppBotSlot(uid)
      if (!allowed) {
        return twimlMessage('Daily command limit reached (50). Try again tomorrow or use the web app.')
      }
      const reply = await handleWhatsAppDigestCommand(uid, cmd)
      return replyWithOptionalContent(reply)
    } catch (e) {
      console.error('Twilio inbound bot failed:', e)
      return twimlMessage('Something went wrong. Open the web app or try again later.')
    }
  }

  return new NextResponse(null, { status: 204 })
}
