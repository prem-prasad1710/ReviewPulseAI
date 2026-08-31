import * as Sentry from '@sentry/nextjs'
import { isSentryEnabled } from '@/lib/sentry-config'

type ReportContext = {
  tags?: Record<string, string>
  extra?: Record<string, unknown>
  level?: 'error' | 'warning'
}

export function reportException(error: unknown, context?: ReportContext) {
  if (!isSentryEnabled()) return

  Sentry.withScope((scope) => {
    if (context?.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value)
      }
    }
    if (context?.extra) scope.setExtras(context.extra)
    if (context?.level) scope.setLevel(context.level)
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)))
  })
}
