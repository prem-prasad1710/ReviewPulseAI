import Razorpay from 'razorpay'
import crypto from 'crypto'

/** Server-side keys only. For checkout in the browser, also set NEXT_PUBLIC_RAZORPAY_KEY_ID (same key id value). */
export function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim()
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()

  if (!keyId || !keySecret) {
    const missing = [
      !keyId && 'RAZORPAY_KEY_ID',
      !keySecret && 'RAZORPAY_KEY_SECRET',
    ].filter(Boolean) as string[]
    throw new Error(`Missing Razorpay credentials: ${missing.join(', ')}`)
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
