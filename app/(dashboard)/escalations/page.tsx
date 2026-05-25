'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type Task = {
  _id: string
  status: string
  priority: string
  reason: string
  createdAt: string
  locationId?: { name?: string } | null
  reviewId?: { _id?: string; rating?: number; comment?: string; reviewerName?: string } | null
}

export default function EscalationsPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/escalations')
      const j = await res.json().catch(() => ({}))
      setLoading(false)
      if (res.ok) setTasks((j?.data as Task[]) || [])
    })()
  }, [])

  const resolveOne = async (id: string) => {
    const res = await fetch(`/api/escalations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    })
    if (res.ok) {
      setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, status: 'resolved' } : t)))
    }
  }

  return (
    <div className="space-y-8 pb-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
          Operations · PDF playbook
        </p>
        <h1 className="font-heading mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
          Escalation inbox
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Auto-generated when new reviews arrive with ≤2 stars or serious safety cues. Optionally notify Slack via{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">ESCALATION_SLACK_WEBHOOK_URL</code>.
        </p>
      </div>

      <Card className="border-slate-200/90 divide-y divide-slate-100 dark:border-slate-700/80 dark:divide-slate-800">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : tasks.length === 0 ? (
          <p className="p-6 text-sm text-slate-600 dark:text-slate-300">No open escalations 🎉</p>
        ) : (
          tasks.map((t) => {
            const rid = typeof t.reviewId === 'object' && t.reviewId ? String(t.reviewId._id || '') : ''
            const open = `${rid ? `/reviews?review=${encodeURIComponent(rid)}&openReply=1` : '/reviews'}`
            return (
              <div key={t._id} className={`flex flex-col gap-3 p-5 md:flex-row md:items-start md:justify-between ${t.status !== 'open' ? 'opacity-60' : ''}`}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${t.priority === 'high' ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-100' : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-50'}`}
                    >
                      {t.priority}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {t.status}
                    </span>
                    {typeof t.locationId === 'object' && t.locationId?.name ? (
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{t.locationId.name}</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{t.reason}</p>
                  {typeof t.reviewId === 'object' && t.reviewId ? (
                    <p className="mt-2 truncate text-xs text-slate-500 dark:text-slate-400">
                      {t.reviewId.rating}★ · {t.reviewId.reviewerName}
                      {(t.reviewId.comment ?? '').slice(0, 120)}
                      {(t.reviewId.comment || '').length > 120 ? '…' : ''}
                    </p>
                  ) : null}
                  <p className="mt-2 text-[11px] text-slate-400">{new Date(t.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={open}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-300/90 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    Open inbox
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  {t.status === 'open' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => void resolveOne(t._id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark resolved
                    </Button>
                  ) : null}
                </div>
              </div>
            )
          })
        )}
      </Card>
    </div>
  )
}
