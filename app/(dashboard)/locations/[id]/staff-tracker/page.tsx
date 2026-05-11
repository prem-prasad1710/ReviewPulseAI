'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TD, TH } from '@/components/ui/table'

type Row = {
  staffName: string
  positive: number
  negative: number
  neutral: number
  sentimentPct: number
  lastMentioned: string
  total: number
}

export default function StaffTrackerPage() {
  const params = useParams()
  const id = String(params.id)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [sort, setSort] = useState<'mentions' | 'positive' | 'negative' | 'recent'>('mentions')
  const [panel, setPanel] = useState<string | null>(null)
  const [quotes, setQuotes] = useState<Array<{ quote: string; sentiment: string; reviewDate: string }>>([])

  const load = async () => {
    const res = await fetch(`/api/locations/${id}/staff-tracker`)
    const json = await res.json()
    if (!res.ok) {
      setError(json?.error || 'Failed to load')
      setLoading(false)
      return
    }
    setRows(json?.data?.rows || [])
    setLoading(false)
  }

  useEffect(() => {
    queueMicrotask(() => {
      void load()
    })
  }, [id])

  const sorted = [...rows].sort((a, b) => {
    if (sort === 'positive') return b.positive - a.positive
    if (sort === 'negative') return b.negative - a.negative
    if (sort === 'recent')
      return new Date(b.lastMentioned).getTime() - new Date(a.lastMentioned).getTime()
    return b.total - a.total
  })

  const openPanel = async (name: string) => {
    setPanel(name)
    const res = await fetch(`/api/locations/${id}/staff-quotes?staffName=${encodeURIComponent(name)}`)
    const json = await res.json()
    setQuotes(json?.data?.quotes || [])
  }

  const hideRow = async (name: string) => {
    const res = await fetch(`/api/locations/${id}/staff-tracker`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffName: name }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      toast.error(j?.error || 'Failed to hide')
      return
    }
    toast.success('Hidden from board')
    setPanel(null)
    void load()
  }

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
      <div className="mx-auto max-w-4xl space-y-4">
        <Link href="/locations" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Locations
        </Link>
        <Card className="p-6">
          <CardTitle className="text-base">{error}</CardTitle>
          <CardDescription className="mt-2">Staff shoutouts unlock on Growth and Scale.</CardDescription>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <Link href="/locations" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Locations
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Staff shoutouts</p>
          <h1 className="font-heading mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
            <Users className="h-7 w-7 text-indigo-600" />
            Team mentions from reviews
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Names are extracted with AI from review text. Remove false positives anytime.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['mentions', 'positive', 'negative', 'recent'] as const).map((k) => (
            <Button key={k} size="sm" variant={sort === k ? 'default' : 'outline'} className="rounded-xl capitalize" onClick={() => setSort(k)}>
              {k === 'mentions' ? 'Most mentioned' : k}
            </Button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden p-0 dark:border-slate-700 dark:bg-slate-900/60">
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80">
                <TH>Staff</TH>
                <TH>Positive</TH>
                <TH>Negative</TH>
                <TH>Neutral</TH>
                <TH>Sentiment %</TH>
                <TH>Last mentioned</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <TD colSpan={7} className="py-10 text-center text-sm text-slate-500">
                    No staff mentions yet. Sync reviews — shoutouts appear after AI scans new text.
                  </TD>
                </tr>
              ) : (
                sorted.map((r) => (
                  <tr key={r.staffName} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <TD className="font-medium">{r.staffName}</TD>
                    <TD>{r.positive}</TD>
                    <TD>{r.negative}</TD>
                    <TD>{r.neutral}</TD>
                    <TD>{r.sentimentPct}%</TD>
                    <TD className="text-xs text-slate-600 dark:text-slate-400">
                      {new Date(r.lastMentioned).toLocaleDateString('en-IN')}
                    </TD>
                    <TD className="text-right">
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => void openPanel(r.staffName)}>
                        Quotes
                      </Button>
                    </TD>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {panel ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 p-4 backdrop-blur-sm">
          <div className="h-full w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-50">{panel}</h2>
              <button type="button" className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" onClick={() => setPanel(null)}>
                Close
              </button>
            </div>
            <Button className="mt-3 rounded-xl" variant="secondary" onClick={() => void hideRow(panel)}>
              Remove from board
            </Button>
            <ul className="mt-4 space-y-3 text-sm">
              {quotes.map((q, i) => (
                <li key={i} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-slate-800 dark:text-slate-100">&ldquo;{q.quote}&rdquo;</p>
                  <p className="mt-1 text-xs capitalize text-slate-500">{q.sentiment}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  )
}
