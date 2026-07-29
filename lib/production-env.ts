/** Boot-time production safety checks — logs errors; never exposes secrets. */
export function validateProductionEnvironment(): void {
  if (process.env.NODE_ENV !== 'production') return

  const errors: string[] = []
  const warnings: string[] = []

  const required = [
    'MONGODB_URI',
    'NEXTAUTH_SECRET',
    'ENCRYPTION_KEY',
    'NEXT_PUBLIC_APP_URL',
    'CRON_SECRET',
  ] as const

  for (const key of required) {
    const val = key === 'NEXTAUTH_SECRET'
      ? process.env.NEXTAUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim()
      : process.env[key]?.trim()
    if (!val) errors.push(key === 'NEXTAUTH_SECRET' ? 'NEXTAUTH_SECRET (or AUTH_SECRET)' : key)
  }

  if (
    process.env.ALLOW_INSECURE_TLS_FOR_DEV === 'true' ||
    process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0'
  ) {
    errors.push('Remove ALLOW_INSECURE_TLS_FOR_DEV and NODE_TLS_REJECT_UNAUTHORIZED in production')
  }

  if (process.env.ALLOW_DEV_SEED === 'true') {
    errors.push('ALLOW_DEV_SEED must not be true in production')
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
    warnings.push('UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN recommended for rate limits')
  }

  for (const msg of warnings) {
    console.warn(`[ReviewPulse] Production warning: ${msg}`)
  }
  for (const msg of errors) {
    console.error(`[ReviewPulse] Production misconfiguration: ${msg}`)
  }
}
