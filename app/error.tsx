'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ReviewPulse]', error.message, error.digest)
  }, [error.digest, error.message])

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
        Something went wrong
      </p>
      <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
        We could not load this page safely
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Your data is unaffected. Retry the view, or head back home. Persistent issues usually mean a downstream service outage—check operational status and logs.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          className="inline-flex items-center rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f56c8]"
          onClick={() => reset()}
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-xl border border-slate-300/90 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  )
}
