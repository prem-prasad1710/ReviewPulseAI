import { bootstrapCanonicalAuthUrl } from '@/lib/bootstrap-auth-url'

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  bootstrapCanonicalAuthUrl()

  const critical: string[] = []
  if (!process.env.MONGODB_URI?.trim()) critical.push('MONGODB_URI')
  if (!(process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET)?.trim()) {
    critical.push('NEXTAUTH_SECRET (or AUTH_SECRET)')
  }
  if (!process.env.ENCRYPTION_KEY?.trim()) {
    critical.push('ENCRYPTION_KEY (required for Google review sync)')
  }

  if (critical.length > 0) {
    const level = process.env.NODE_ENV === 'production' ? 'error' : 'warn'
    const log = level === 'error' ? console.error : console.warn
    log(
      `[ReviewPulse] Missing required env${process.env.NODE_ENV === 'production' ? ' in production' : ''}: ${critical.join(', ')}. Google review sync will fail until fixed.`
    )
  }

  if (process.env.NODE_ENV !== 'production') return

  const urls = ['NEXTAUTH_URL', 'NEXT_PUBLIC_APP_URL'].filter((k) => !process.env[k]?.trim())
  if (urls.length > 0) {
    console.warn(
      `[ReviewPulse] Recommended for production redirects, links, webhooks & SEO: ${urls.join(', ')} (set canonical app URL)`
    )
  }

  /** External features stay disabled until credentials exist — warn once at boot. */
  const optionalBundles: Record<string, string[]> = {
    'AI replies & chat':
      ![process.env.GROQ_API_KEY, process.env.OPENAI_API_KEY].some((k) => Boolean(k?.trim()))
        ? ['OPENAI_API_KEY and/or GROQ_API_KEY']
        : [],
    'Google Places / Translate / Maps (server-side)': [
      ...(!process.env.GOOGLE_PLACES_API_KEY?.trim() ? ['GOOGLE_PLACES_API_KEY'] : []),
      ...(!process.env.GOOGLE_TRANSLATE_API_KEY?.trim() ? ['GOOGLE_TRANSLATE_API_KEY'] : []),
    ],
    WhatsApp: [
      ...(!process.env.TWILIO_ACCOUNT_SID?.trim() ? ['TWILIO_ACCOUNT_SID'] : []),
      ...(!process.env.TWILIO_AUTH_TOKEN?.trim() ? ['TWILIO_AUTH_TOKEN'] : []),
      ...(!process.env.TWILIO_WHATSAPP_FROM?.trim() ? ['TWILIO_WHATSAPP_FROM'] : []),
    ],
    Email: !process.env.RESEND_API_KEY?.trim() ? ['RESEND_API_KEY'] : [],
    'Rate limiting': !(
      process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
    )
      ? ['UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN']
      : [],
    'Billing (Razorpay)': !process.env.RAZORPAY_KEY_ID?.trim() ? ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'] : [],
    'Cron endpoints': !process.env.CRON_SECRET?.trim() ? ['CRON_SECRET'] : [],
    'Slack escalation': !process.env.ESCALATION_SLACK_WEBHOOK_URL?.trim()
      ? ['ESCALATION_SLACK_WEBHOOK_URL']
      : [],
    'Yelp Fusion': !process.env.YELP_API_KEY?.trim() ? ['YELP_API_KEY'] : [],
    'Monthly reports blob storage': !process.env.BLOB_READ_WRITE_TOKEN?.trim()
      ? ['BLOB_READ_WRITE_TOKEN']
      : [],
  }

  for (const [label, missing] of Object.entries(optionalBundles)) {
    if (missing.length > 0) {
      console.warn(`[ReviewPulse] ${label} inactive until configured (missing ${missing.join(', ')})`)
    }
  }
}
