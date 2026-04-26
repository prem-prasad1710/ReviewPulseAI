import Razorpay from 'razorpay'
import crypto from 'crypto'

export function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error('Missing Razorpay credentials')
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })
}

const PLAN_MAP = {
  starter: process.env.RAZORPAY_PLAN_STARTER,
  growth: process.env.RAZORPAY_PLAN_GROWTH,
  scale: process.env.RAZORPAY_PLAN_SCALE,
} as const

export function getRazorpayPlanId(plan: keyof typeof PLAN_MAP) {
  const planId = PLAN_MAP[plan]
  if (!planId) {
    throw new Error(`Missing Razorpay plan id for ${plan}`)
  }
  return planId
}

export function verifyRazorpayWebhookSignature(body: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) throw new Error('Missing RAZORPAY_WEBHOOK_SECRET')

  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return expected === signature
}
