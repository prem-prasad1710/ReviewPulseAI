import * as Sentry from '@sentry/nextjs'
import { sentryRuntimeOptions } from '@/lib/sentry-config'

Sentry.init({
  ...sentryRuntimeOptions(),
  sendDefaultPii: false,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1,
  ignoreErrors: [
    'ResizeObserver loop completed with undelivered notifications',
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
  denyUrls: [/extensions\//i, /^chrome:\/\//i, /^moz-extension:\/\//i],
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
