'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect, useState } from 'react'

class SentryExampleFrontendError extends Error {
  constructor(message: string | undefined) {
    super(message)
    this.name = 'SentryExampleFrontendError'
  }
}

export default function SentryExamplePage() {
  const [hasSentError, setHasSentError] = useState(false)
  const [isConnected, setIsConnected] = useState(true)

  useEffect(() => {
    Sentry.logger.info('Sentry example page loaded')
    void Sentry.diagnoseSdkConnectivity().then((result) => {
      setIsConnected(result !== 'sentry-unreachable')
    })
  }, [])

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">Sentry example page</h1>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Click the button to send a frontend and backend test error to{' '}
        <a
          className="font-medium text-indigo-600 underline dark:text-indigo-300"
          href="https://prem-prasad1710.sentry.io/issues/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Sentry Issues
        </a>
        .
      </p>
      <button
        type="button"
        disabled={!isConnected}
        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        onClick={async () => {
          Sentry.logger.info('User clicked the button, throwing a sample error')
          await Sentry.startSpan({ name: 'Example Frontend/Backend Span', op: 'test' }, async () => {
            const res = await fetch('/api/sentry-example-api')
            if (!res.ok) setHasSentError(true)
          })
          throw new SentryExampleFrontendError('This error is raised on the frontend of the example page.')
        }}
      >
        Throw Sample Error
      </button>
      {hasSentError ? (
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Error sent to Sentry.</p>
      ) : !isConnected ? (
        <p className="text-sm text-rose-600">
          Sentry looks blocked (ad blocker or missing DSN). Disable blockers and confirm NEXT_PUBLIC_SENTRY_DSN is set.
        </p>
      ) : null}
    </main>
  )
}
