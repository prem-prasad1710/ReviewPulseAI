import { NextResponse } from 'next/server'

/** Twilio status callback — acknowledge delivery updates. */
export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const sid = form.get('MessageSid')
    const status = form.get('MessageStatus')
    console.error('Twilio webhook:', { sid, status })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Twilio webhook error:', error)
    return new NextResponse(null, { status: 204 })
  }
}
