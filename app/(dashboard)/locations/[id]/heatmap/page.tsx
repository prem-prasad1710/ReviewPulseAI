'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Grid3x3 } from 'lucide-react'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type Cell = {
  _id: { dayOfWeek: number; hour: number }
  avgSentiment: number
  avgRating: number
  count: number
}

function colorForCell(avgSentiment: number, count: number, maxCount: number): string {
  const t = (avgSentiment + 1) / 2
  const r1 = 252 - Math.round(30 * t)
  const g1 = 235 - Math.round(20 * (1 - t))
  const r2 = 241 + Math.round(14 * t)
  const g2 = 239 + Math.round(14 * t)
  const b3 = 222 + Math.round(20 * t)
  const r = Math.round(r1 * (1 - t) + r2 * t)
  const g = Math.round(g1 * (1 - t) + g2 * t)
  const b = Math.round(235 * (1 - t) + b3 * t)
  const opacity = count === 0 ? 0.2 : 0.35 + (maxCount ? Math.min(0.65, (count / maxCount) * 0.65) : 0.35)
  return `rgba(${r},${g},${b},${opacity})`
}

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function HeatmapPage() {
  const params = useParams()
  const id = String(params.id)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cells, setCells] = useState<Cell[]>([])
  const [total, setTotal] = useState(0)
  const [minUnlock, setMinUnlock] = useState(50)

  useEffect(() => {
    queueMicrotask(() => {
      void (async () => {
        const res = await fetch(`/api/locations/${id}/heatmap`)
        const json = await res.json()
        if (!res.ok) {
          setError(json?.error || 'Failed to load')
          setLoading(false)
          return
        }
        setCells(json?.data?.cells || [])
        setTotal(Number(json?.data?.totalReviewsInWindow || 0))
        setMinUnlock(Number(json?.data?.minReviewsToUnlock || 50))
        setLoading(false)
      })()
    })
  }, [id])

  const map = useMemo(() => {
    const m = new Map<string, Cell>()
    for (const c of cells) {
      m.set(`${c._id.dayOfWeek}-${c._id.hour}`, c)
    }
    return m
  }, [cells])

  const maxCount = useMemo(() => cells.reduce((m, c) => Math.max(m, c.count), 0), [cells])

  const summary = useMemo(() => {
    const valid = cells.filter((c) => c.count >= 2)
    if (!valid.length) return { best: null as Cell | null, worst: null as Cell | null, busy: null as Cell | null }
    const best = [...valid].sort((a, b) => b.avgSentiment - a.avgSentiment)[0]
    const worst = [...valid].sort((a, b) => a.avgSentiment - b.avgSentiment)[0]
    const busy = [...valid].sort((a, b) => b.count - a.count)[0]
    return { best, worst, busy }
  }, [cells])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link href="/locations" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Locations
        </Link>
        <Card className="p-6">
          <CardTitle className="text-base">{error}</CardTitle>
        </Card>
      </div>
    )
  }

  const locked = total < minUnlock

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <Link href="/locations" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Locations
      </Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Mood heatmap</p>
        <h1 className="font-heading mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
          <Grid3x3 className="h-7 w-7 text-indigo-600" />
          When customers write reviews (IST)
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Green slots lean positive; red slots lean negative. Opacity reflects volume. Last 90 days.
        </p>
      </div>

      <div className="relative overflow-x-auto rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
        {locked ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm dark:bg-slate-950/70">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Need {minUnlock - total} more reviews to unlock</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Heatmap stays blurred until you reach {minUnlock} reviews in the window.</p>
          </div>
        ) : null}
        <div className={locked ? 'pointer-events-none select-none blur-sm' : ''}>
          <div className="grid" style={{ gridTemplateColumns: `64px repeat(7, minmax(0,1fr))` }}>
            <div />
            {dayLabels.map((d) => (
              <div key={d} className="px-1 pb-1 text-center text-[10px] font-semibold uppercase text-slate-500">
                {d}
              </div>
            ))}
            {Array.from({ length: 24 }).map((_, hour) => (
              <Fragment key={hour}>
                <div className="pr-2 text-right text-[10px] text-slate-500">
                  {hour}–{hour + 1}
                </div>
                {dayLabels.map((_, di) => {
                  const dow = di + 1
                  const key = `${dow}-${hour}`
                  const c = map.get(key)
                  const bg = c
                    ? colorForCell(c.avgSentiment, c.count, maxCount)
                    : 'rgba(241,239,232,0.2)'
                  const title = c
                    ? `${dayLabels[di]} ${hour}–${hour + 1} · ${c.count} reviews · avg ${c.avgRating?.toFixed(1) ?? '—'}★`
                    : `${dayLabels[di]} ${hour}–${hour + 1} · no data`
                  return (
                    <div
                      key={key}
                      title={title}
                      className="h-[18px] border border-white/40 dark:border-slate-800/40"
                      style={{ backgroundColor: bg }}
                    />
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <CardTitle className="text-sm">Best time</CardTitle>
          <CardDescription>
            {summary.best
              ? `${dayLabels[summary.best._id.dayOfWeek - 1]} ${summary.best._id.hour}–${summary.best._id.hour + 1} (${summary.best.count} reviews)`
              : 'Need more data'}
          </CardDescription>
        </Card>
        <Card className="p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <CardTitle className="text-sm">Watch this slot</CardTitle>
          <CardDescription>
            {summary.worst
              ? `${dayLabels[summary.worst._id.dayOfWeek - 1]} ${summary.worst._id.hour}–${summary.worst._id.hour + 1} (${summary.worst.count} reviews)`
              : 'Need more data'}
          </CardDescription>
        </Card>
        <Card className="p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <CardTitle className="text-sm">Busiest</CardTitle>
          <CardDescription>
            {summary.busy
              ? `${dayLabels[summary.busy._id.dayOfWeek - 1]} ${summary.busy._id.hour}–${summary.busy._id.hour + 1} (${summary.busy.count} reviews)`
              : 'Need more data'}
          </CardDescription>
        </Card>
      </div>
    </div>
  )
}
