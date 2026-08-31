import { getAppUrl } from '@/lib/app-url'

const DEV_ONLY_ENV_KEYS = [
  'ALLOW_INSECURE_TLS_FOR_DEV',
  'ALLOW_DEV_SEED',
  'NODE_TLS_REJECT_UNAUTHORIZED',
] as const

/** Strip dev-only flags before validation (production boot). */
export function sanitizeProductionEnv(): string[] {
  if (process.env.NODE_ENV !== 'production') return []

  const actions: string[] = []

  for (const key of DEV_ONLY_ENV_KEYS) {
    const val = process.env[key]?.trim()
    if (!val) continue
    if (key === 'ALLOW_DEV_SEED' && val !== 'true') continue
    if (key === 'ALLOW_INSECURE_TLS_FOR_DEV' && val !== 'true') continue
    if (key === 'NODE_TLS_REJECT_UNAUTHORIZED' && val !== '0') continue
    delete process.env[key]
    actions.push(`unset ${key}`)
  }

  return actions
}

/** Boot-time production safety checks — logs errors; never exposes secrets. */
export function validateProductionEnvironment(): void {
  if (process.env.NODE_ENV !== 'production') return

  const stripped = sanitizeProductionEnv()
  if (stripped.length > 0) {
    console.info(`[ReviewPulse] Production env sanitized: ${stripped.join('; ')}`)
  }

  const errors: string[] = []
  const warnings: string[] = []
  const optionalMissing: string[] = []

  const required = ['MONGODB_URI', 'NEXTAUTH_SECRET', 'ENCRYPTION_KEY'] as const

  for (const key of required) {
    const val =
      key === 'NEXTAUTH_SECRET'
        ? process.env.NEXTAUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim()
        : process.env[key]?.trim()
    if (!val) errors.push(key === 'NEXTAUTH_SECRET' ? 'NEXTAUTH_SECRET (or AUTH_SECRET)' : key)
  }

  const appUrl = getAppUrl()
  if (!process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    warnings.push(
      appUrl.startsWith('http://localhost')
        ? 'NEXT_PUBLIC_APP_URL unset — set to your primary domain (e.g. https://www.reviewspulse.in)'
        : `NEXT_PUBLIC_APP_URL unset — using ${appUrl} for links; set explicitly to your primary domain for SEO`
    )
  }

  if (!process.env.CRON_SECRET?.trim()) {
    optionalMissing.push('CRON_SECRET (scheduled jobs)')
  }

  if (process.env.AUTH_DEBUG === 'true') {
    warnings.push('AUTH_DEBUG should be false in production')
  }

  if (process.env.ALLOW_PUBLIC_FREE_REPLY_WITHOUT_REDIS === 'true') {
    warnings.push('ALLOW_PUBLIC_FREE_REPLY_WITHOUT_REDIS=true exposes free-reply to abuse — use Upstash Redis')
  }

  const razorpayId = process.env.RAZORPAY_KEY_ID?.trim()
  const publicRazorpay = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim()
  if (razorpayId?.startsWith('rzp_test_')) {
    warnings.push('RAZORPAY_KEY_ID is test mode — switch to rzp_live_ keys before accepting real payments')
  }
  if (razorpayId && publicRazorpay && razorpayId !== publicRazorpay) {
    errors.push('RAZORPAY_KEY_ID and NEXT_PUBLIC_RAZORPAY_KEY_ID must match')
  }

  if (!process.env.UPSTASH_REDIS_REST_URL?.trim() || !process.env.UPSTASH_REDIS_REST_TOKEN?.trim()) {
    optionalMissing.push('UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (rate limits)')
  }

  if (!process.env.RESEND_API_KEY?.trim()) optionalMissing.push('RESEND_API_KEY (email)')
  if (!process.env.ESCALATION_SLACK_WEBHOOK_URL?.trim()) {
    optionalMissing.push('ESCALATION_SLACK_WEBHOOK_URL (Slack alerts)')
  }
  if (!process.env.YELP_API_KEY?.trim()) optionalMissing.push('YELP_API_KEY (Yelp Fusion)')
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    optionalMissing.push('BLOB_READ_WRITE_TOKEN (monthly report PDFs)')
  }

  if (
    ![process.env.GROQ_API_KEY, process.env.OPENAI_API_KEY].some((k) => Boolean(k?.trim()))
  ) {
    optionalMissing.push('OPENAI_API_KEY and/or GROQ_API_KEY (AI replies)')
  }

  if (!process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() && !process.env.SENTRY_DSN?.trim()) {
    optionalMissing.push('NEXT_PUBLIC_SENTRY_DSN (error monitoring)')
  }

  for (const msg of warnings) {
    console.warn(`[ReviewPulse] Production warning: ${msg}`)
  }
  for (const msg of errors) {
    console.error(`[ReviewPulse] Production misconfiguration: ${msg}`)
  }
  if (optionalMissing.length > 0) {
    console.info(
      `[ReviewPulse] Optional features inactive until configured: ${optionalMissing.join('; ')}`
    )
  }
}
