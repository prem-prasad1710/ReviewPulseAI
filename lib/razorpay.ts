import Razorpay from 'razorpay'
import crypto from 'crypto'

/** Server-side keys only. Test (rzp_test_…) or Live (rzp_live_…) — must match plan mode. Browser checkout needs NEXT_PUBLIC_RAZORPAY_KEY_ID with the same Key ID string. */
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

function normalizeKeyId(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["']|["']$/g, '')
}

/** Safe billing readiness snapshot — never exposes secrets or full key ids. */
export function getRazorpayConfigStatus() {
  const serverKeyId = normalizeKeyId(process.env.RAZORPAY_KEY_ID)
  const publicKeyId = normalizeKeyId(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)
  const hasSecret = Boolean(process.env.RAZORPAY_KEY_SECRET?.trim())
  const webhookSecretSet = Boolean(process.env.RAZORPAY_WEBHOOK_SECRET?.trim())

  const mode: 'live' | 'test' | 'unknown' = serverKeyId.startsWith('rzp_live_')
    ? 'live'
    : serverKeyId.startsWith('rzp_test_')
      ? 'test'
      : 'unknown'

  const configuredPlans = (Object.keys(PLAN_ENV_VARS) as RazorpayPlanKey[]).filter((plan) => {
    const raw = process.env[PLAN_ENV_VARS[plan]]
    return typeof raw === 'string' && raw.trim().replace(/^["']|["']$/g, '').length > 0
  })

  const keysMatch = Boolean(serverKeyId && publicKeyId && serverKeyId === publicKeyId)
  const credentialsConfigured = Boolean(serverKeyId && hasSecret)
  const primaryPlansReady = ['starter', 'growth', 'scale', 'agency'].every((p) =>
    configuredPlans.includes(p as RazorpayPlanKey)
  )

  return {
    configured: credentialsConfigured,
    mode,
    acceptsRealPayments: mode === 'live' && credentialsConfigured && keysMatch && primaryPlansReady,
    acceptsTestPayments: mode === 'test' && credentialsConfigured && keysMatch && primaryPlansReady,
    keysMatch,
    webhookSecretSet,
    configuredPlans,
    readyForCheckout:
      credentialsConfigured && keysMatch && primaryPlansReady && (mode === 'live' || mode === 'test'),
    notes: [
      ...(mode === 'test' ? ['Test mode — real cards are not charged; use Razorpay test cards only.'] : []),
      ...(mode === 'live' ? ['Live mode — real payments will be captured.'] : []),
      ...(!keysMatch ? ['RAZORPAY_KEY_ID and NEXT_PUBLIC_RAZORPAY_KEY_ID must match.'] : []),
      ...(!webhookSecretSet ? ['RAZORPAY_WEBHOOK_SECRET missing — plan sync may rely on client confirm only.'] : []),
      ...(!primaryPlansReady ? ['One or more primary plan ids (starter/growth/scale/agency) are missing.'] : []),
    ],
  }
}
