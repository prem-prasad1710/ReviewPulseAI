export function getSentryDsn(): string {
  return process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || process.env.SENTRY_DSN?.trim() || ''
}

export function isSentryEnabled(): boolean {
  return Boolean(getSentryDsn()) && process.env.SENTRY_DISABLED !== 'true'
}

export function sentryRuntimeOptions() {
  return {
    dsn: getSentryDsn(),
    enabled: isSentryEnabled(),
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT?.trim() ||
      process.env.SENTRY_ENVIRONMENT?.trim() ||
      process.env.NEXT_PUBLIC_VERCEL_ENV?.trim() ||
      process.env.VERCEL_ENV?.trim() ||
      process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE?.trim() || process.env.VERCEL_GIT_COMMIT_SHA?.trim() || undefined,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.12 : 1,
  }
}
