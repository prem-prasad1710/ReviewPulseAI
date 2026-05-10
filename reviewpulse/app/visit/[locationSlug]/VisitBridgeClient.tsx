'use client'

import { useEffect, useMemo, useState } from 'react'

function formatRef(ref: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ref)) return ref || 'your visit'
  const [y, m, d] = ref.split('-').map(Number)
  try {
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return ref
  }
}

export default function VisitBridgeClient(props: {
  businessName: string
  category: string
  locationSlug: string
  refDate: string
  googleReviewUrl: string
}) {
  const starter = useMemo(
    () => `I visited ${props.businessName} on ${formatRef(props.refDate)}. `,
    [props.businessName, props.refDate]
  )
  const [text, setText] = useState(starter)

  useEffect(() => {
    if (!props.refDate || !/^\d{4}-\d{2}-\d{2}$/.test(props.refDate)) return
    void fetch('/api/bridge/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationSlug: props.locationSlug, date: props.refDate }),
    }).catch(() => {})
  }, [props.locationSlug, props.refDate])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-12 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200/90 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          {props.category}
        </p>
        <h1 className="mt-2 text-center font-heading text-2xl font-bold text-slate-900 dark:text-slate-50">
          {props.businessName}
        </h1>
        <p className="mt-4 text-center text-lg text-slate-700 dark:text-slate-200">Thank you for visiting!</p>
        <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
          Copy the text below, then open Google Reviews and paste it to continue your review.
        </p>
        <label className="mt-3 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="starter">
          Starter text (editable)
        </label>
        <textarea
          id="starter"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
        />
        <a
          href={props.googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700"
        >
          Open Google Reviews →
        </a>
      </div>
    </div>
  )
}
