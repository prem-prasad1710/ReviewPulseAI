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

const PLAN_ENV_VARS: Record<
  'starter' | 'growth' | 'scale' | 'agency' | 'agency_addon',
  string
> = {
  starter: 'RAZORPAY_PLAN_STARTER',
  growth: 'RAZORPAY_PLAN_GROWTH',
  scale: 'RAZORPAY_PLAN_SCALE',
  agency: 'RAZORPAY_PLAN_AGENCY',
  agency_addon: 'RAZORPAY_PLAN_AGENCY_ADDON',
} as const

export type RazorpayPlanKey = keyof typeof PLAN_ENV_VARS

export function getRazorpayPlanId(plan: RazorpayPlanKey) {
  const envName = PLAN_ENV_VARS[plan]
  const raw = process.env[envName]
  const planId = typeof raw === 'string' ? raw.trim() : ''
  if (!planId) {
    throw new Error(
      `Missing Razorpay plan id for "${plan}". Set ${envName} to the Subscription Plan ID from Razorpay Dashboard → Plans (format plan_xxxxxxxx).`
    )
  }
  return planId
}

export function verifyRazorpayWebhookSignature(body: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) throw new Error('Missing RAZORPAY_WEBHOOK_SECRET')

  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return expected === signature
}
