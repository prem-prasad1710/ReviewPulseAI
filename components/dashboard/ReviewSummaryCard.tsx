'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type Summary = {
  headline: string
  positives: string[]
  negatives: string[]
  reviewCount: number
  windowDays: number
  businessLabel?: string
}

export default function ReviewSummaryCard({ locationId }: { locationId?: string | null }) {
  const [data, setData] = useState<Summary | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const run = async () => {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch('/api/ai/summarize-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 7, ...(locationId ? { locationId } : {}) }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(j?.error || 'Could not summarise reviews')
        return
      }
      setData(j.data as Summary)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once mount / scope
  }, [locationId])

  return (
    <Card className="border-slate-200/90 p-5 dark:border-slate-700/80 dark:bg-slate-900/50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
            Review summary · PDF roadmap
          </p>
          <h3 className="font-heading mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
            Last 7 days at a glance
          </h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            AI condensation of praise and complaints • English briefing for founders
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-2" disabled={busy} onClick={() => void run()}>
          <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {err ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{err}</p> : null}

      {data ? (
        <div className="mt-4 space-y-4">
          <div className="flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-3 text-sm text-indigo-950 dark:border-indigo-500/35 dark:bg-indigo-950/40 dark:text-indigo-100">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <span className="font-semibold">{data.businessLabel || 'Workspace'} · </span>
              {data.headline}{' '}
              <span className="text-indigo-800/75 dark:text-indigo-200/80">
                ({data.reviewCount} reviews / {data.windowDays} days)
              </span>
            </p>
          </div>
          {data.positives.length > 0 ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Wins</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700 dark:text-slate-200">
                {data.positives.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {data.negatives.length > 0 ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-rose-700 dark:text-rose-400">Friction</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700 dark:text-slate-200">
                {data.negatives.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {data.reviewCount === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No reviews synced in this window — run a GBP sync after new feedback arrives.
            </p>
          ) : null}
        </div>
      ) : !err && busy ? (
        <p className="mt-4 text-sm text-slate-500">Summarising…</p>
      ) : null}
    </Card>
  )
}
