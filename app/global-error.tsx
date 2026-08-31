'use client'

import { useEffect } from 'react'
import { reportException } from '@/lib/report-exception'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportException(error, {
      tags: { source: 'global-error' },
      extra: { digest: error.digest },
    })
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 py-16 text-center text-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Something went wrong</p>
        <h1 className="text-2xl font-bold sm:text-3xl">We could not load this page safely</h1>
        <p className="max-w-md text-sm leading-relaxed text-slate-600">
          The error was reported automatically. Retry this view, or go back home.
        </p>
        <button
          type="button"
          className="inline-flex items-center rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white"
          onClick={() => reset()}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
