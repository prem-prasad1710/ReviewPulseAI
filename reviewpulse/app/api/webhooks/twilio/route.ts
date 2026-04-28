import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { shouldVerifyTwilioWebhookSignature, webhookUrlForSignatureValidation } from '@/lib/twilio-config'

const emptyTwiml =
  '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'

/**
 * Twilio webhooks:
 * - Status callbacks (MessageStatus) for outbound WhatsApp — delivery / errors
 * - Inbound WhatsApp/SMS (Body, From) — ack with empty TwiML
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
  const body = params.Body
  const from = params.From

  if (messageStatus) {
    if (messageStatus === 'failed' || messageStatus === 'undelivered') {
      console.error('Twilio message issue:', { messageSid, messageStatus, errorCode, to: params.To })
    } else if (process.env.NODE_ENV === 'development') {
      console.info('Twilio status:', { messageSid, messageStatus })
    }
    return new NextResponse(null, { status: 204 })
  }

  if (body !== undefined || from) {
    if (process.env.NODE_ENV === 'development') {
      console.info('Twilio inbound:', { from, preview: body?.slice(0, 120) })
    }
    return new NextResponse(emptyTwiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    })
  }

  return new NextResponse(null, { status: 204 })
}
