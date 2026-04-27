'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, ChefHat, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TD, TH } from '@/components/ui/table'
import { recommendationForItem } from '@/lib/menu-insight-helpers'

type Item = { name: string; positiveCount: number; negativeCount: number; sampleQuote: string }

export default function MenuInsightsPage() {
  const params = useParams()
  const id = String(params.id)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('Menu insights')
  const [items, setItems] = useState<Item[]>([])
  const [lastRun, setLastRun] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    const res = await fetch(`/api/locations/${id}/menu-insights`)
    const json = await res.json()
    if (!res.ok) {
      setError(json?.error || 'Failed to load')
      setLoading(false)
      return
    }
    setTitle(json?.data?.title || 'Insights')
    setItems(json?.data?.menuInsights?.items || [])
    setLastRun(json?.data?.menuInsights?.lastRunAt || null)
    setLoading(false)
  }

  useEffect(() => {
    queueMicrotask(() => {
      void load()
    })
  }, [id])

  const refresh = async () => {
    setRefreshing(true)
    const res = await fetch(`/api/locations/${id}/menu-insights/refresh`, { method: 'POST' })
    const json = await res.json()
    setRefreshing(false)
    if (!res.ok) {
      toast.error(json?.error || 'Refresh failed')
      return
    }
    toast.success('Analysis refreshed')
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
          <CardDescription className="mt-2">Menu insights are the Scale plan anchor feature.</CardDescription>
        </Card>
      </div>
    )
  }

  const sorted = [...items].sort(
    (a, b) => b.positiveCount + b.negativeCount - (a.positiveCount + a.negativeCount)
  )

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <Link href="/locations" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Locations
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Menu optimizer</p>
          <h1 className="font-heading mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
            <ChefHat className="h-7 w-7 text-indigo-600" />
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            AI clusters what customers praise or complain about. Heavy analysis — refresh at most once per 7 days.
          </p>
          {lastRun ? (
            <p className="mt-2 text-xs text-slate-500">Last analyzed: {new Date(lastRun).toLocaleString('en-IN')}</p>
          ) : null}
        </div>
        <Button className="rounded-xl" variant="secondary" disabled={refreshing} onClick={() => void refresh()}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh now
        </Button>
      </div>

      <Card className="overflow-hidden p-0 dark:border-slate-700 dark:bg-slate-900/60">
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80">
                <TH>Item</TH>
                <TH>Loved</TH>
                <TH>Complaints</TH>
                <TH>Recommendation</TH>
                <TH>Sample quote</TH>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <TD colSpan={5} className="py-10 text-center text-sm text-slate-500">
                    No insights yet. Run monthly cron or tap Refresh (Scale).
                  </TD>
                </tr>
              ) : (
                sorted.map((it) => {
                  const rec = recommendationForItem(it.positiveCount, it.negativeCount)
                  const recClass =
                    rec.tone === 'promote'
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : rec.tone === 'attention'
                        ? 'text-amber-800 dark:text-amber-200'
                        : rec.tone === 'remove'
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-slate-600 dark:text-slate-400'
                  return (
                    <tr key={it.name} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <TD className="font-medium">{it.name}</TD>
                      <TD>{it.positiveCount}</TD>
                      <TD>{it.negativeCount}</TD>
                      <TD className={`text-sm font-medium ${recClass}`}>{rec.label}</TD>
                      <TD className="max-w-xs text-xs text-slate-600 dark:text-slate-400">{it.sampleQuote}</TD>
                    </tr>
                  )
                })
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
