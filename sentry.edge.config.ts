import * as Sentry from '@sentry/nextjs'
import { sentryRuntimeOptions } from '@/lib/sentry-config'

Sentry.init({
  ...sentryRuntimeOptions(),
  sendDefaultPii: false,
})
