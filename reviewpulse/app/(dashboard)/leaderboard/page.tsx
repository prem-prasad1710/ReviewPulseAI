'use client'

import { useEffect, useState } from 'react'

type Row = { id: string; name?: string; score: number; averageRating: number; totalReviews: number }

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/leaderboard')
      const j = await res.json().catch(() => ({}))
      if (!res.ok) setErr(j?.error || 'Failed')
      else setRows((j?.data?.leaderboard as Row[]) || [])
    })()
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-heading text-2xl font-bold">Multi-location leaderboard</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">C5 — score blends average rating with review volume.</p>
      {err ? <p className="mt-4 text-sm text-red-600">{err}</p> : null}
      <ol className="mt-6 space-y-2">
        {rows.map((r, i) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950/50"
          >
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
              #{i + 1} {r.name}
            </span>
            <span className="text-xs text-slate-500">
              {r.averageRating.toFixed(2)}★ · {r.totalReviews} rev · score {r.score}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
