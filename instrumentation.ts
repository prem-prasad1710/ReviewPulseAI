import * as Sentry from '@sentry/nextjs'
import { bootstrapCanonicalAuthUrl } from '@/lib/bootstrap-auth-url'
import { validateProductionEnvironment } from '@/lib/production-env'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }

  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  bootstrapCanonicalAuthUrl()
  validateProductionEnvironment()

  if (process.env.NODE_ENV !== 'production') {
    const critical: string[] = []
    if (!process.env.MONGODB_URI?.trim()) critical.push('MONGODB_URI')
    if (!(process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET)?.trim()) {
      critical.push('NEXTAUTH_SECRET (or AUTH_SECRET)')
    }
    if (!process.env.ENCRYPTION_KEY?.trim()) {
      critical.push('ENCRYPTION_KEY (required for Google review sync)')
    }

    if (critical.length > 0) {
      console.warn(
        `[ReviewPulse] Missing required env: ${critical.join(', ')}. Google review sync will fail until fixed.`
      )
    }
  }
}

export const onRequestError = Sentry.captureRequestError
