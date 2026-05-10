/** Public origin Twilio should use when signing webhooks (matches Messaging / Status callback URL). */
export function getPublicAppOrigin(): string {
  const raw =
    process.env.TWILIO_WEBHOOK_PUBLIC_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    ''
  return raw.replace(/\/$/, '')
}

export function getTwilioStatusCallbackUrl(): string | undefined {
  const base = getPublicAppOrigin()
  if (!base) return undefined
  return `${base}/api/webhooks/twilio`
}

export function isTwilioWhatsAppConfigured(): boolean {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const token = process.env.TWILIO_AUTH_TOKEN?.trim()
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim()
  return Boolean(sid && token && from)
}

/** URL string Twilio used when computing X-Twilio-Signature (must match console callback URL). */
export function webhookUrlForSignatureValidation(request: Request): string {
  const explicit = process.env.TWILIO_WEBHOOK_PUBLIC_URL?.trim()
  if (explicit) {
    return explicit.endsWith('/api/webhooks/twilio') ? explicit : `${explicit.replace(/\/$/, '')}/api/webhooks/twilio`
  }
  return request.url
}

/** Validates X-Twilio-Signature when TWILIO_WEBHOOK_PUBLIC_URL is set (must match the URL Twilio calls). */
export function shouldVerifyTwilioWebhookSignature(): boolean {
  if (process.env.TWILIO_SKIP_SIGNATURE_VERIFY === 'true') return false
  if (!process.env.TWILIO_AUTH_TOKEN?.trim()) return false
  return Boolean(process.env.TWILIO_WEBHOOK_PUBLIC_URL?.trim() && process.env.NODE_ENV === 'production')
}
