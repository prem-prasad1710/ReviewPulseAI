'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Radar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface CompetitorRow {
  _id: string
  name: string
  address?: string
  placeId: string
  lastAnalyzedAt?: string
  themes?: { positive: string[]; negative: string[] }
}

export default function CompetitorsPage() {
  const params = useParams()
  const id = String(params.id)
  const [loading, setLoading] = useState(true)
  const [planOk, setPlanOk] = useState(false)
  const [limit, setLimit] = useState(0)
  const [rows, setRows] = useState<CompetitorRow[]>([])
  const [mapsUrl, setMapsUrl] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch(`/api/locations/${id}/competitors`)
    const json = await res.json()
    setRows(json?.data?.competitors || [])
    setPlanOk(Boolean(json?.data?.planOk))
    setLimit(json?.data?.limit ?? 0)
    setLoading(false)
  }

  useEffect(() => {
    queueMicrotask(() => {
      void load()
    })
  }, [id])

  const add = async () => {
    const res = await fetch(`/api/locations/${id}/competitors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapsUrl }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json?.error || 'Failed to add')
      return
    }
    toast.success('Competitor added')
    setMapsUrl('')
    await load()
  }

  const analyze = async (cid: string) => {
    const res = await fetch(`/api/locations/${id}/competitors/${cid}/analyze`, { method: 'POST' })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json?.error || 'Analysis failed')
      return
    }
    toast.success('Themes updated')
    await load()
  }

  const remove = async (cid: string) => {
    const res = await fetch(`/api/locations/${id}/competitors?competitorId=${encodeURIComponent(cid)}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const json = await res.json()
      toast.error(json?.error || 'Delete failed')
      return
    }
    await load()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <Link href="/locations" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Locations
      </Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Feature 2</p>
        <h1 className="font-heading mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
          <Radar className="h-7 w-7 text-indigo-600" />
          Competitor Review Spy
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Scale plan: up to {limit} rivals per location. Refresh analysis once per 24 hours.
        </p>
      </div>

      {!planOk ? (
        <Card className="border-amber-200/80 bg-amber-50/60 p-6 dark:border-amber-800/50 dark:bg-amber-950/30">
          <CardTitle className="text-base">Scale only</CardTitle>
          <CardDescription>Upgrade to Scale to track nearby competitors via Google Places.</CardDescription>
        </Card>
      ) : (
        <Card className="space-y-3 p-6 dark:border-slate-700 dark:bg-slate-900/60">
          <CardTitle className="text-base">Add competitor</CardTitle>
          <input
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            placeholder="Paste Google Maps URL (place link)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
          />
          <Button className="rounded-xl" onClick={add}>
            Save competitor
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        {rows.map((c) => (
          <Card key={c._id} className="p-5 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg dark:text-slate-100">{c.name}</CardTitle>
                <CardDescription>{c.address}</CardDescription>
                <p className="mt-1 text-xs text-slate-500">Place ID: {c.placeId}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="rounded-xl" disabled={!planOk} onClick={() => analyze(c._id)}>
                  Analyze
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setOpenId(openId === c._id ? null : c._id)}>
                  Themes
                </Button>
                <Button size="sm" variant="secondary" className="rounded-xl" onClick={() => remove(c._id)}>
                  Remove
                </Button>
              </div>
            </div>
            {openId === c._id ? (
              <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 text-sm dark:border-slate-700 md:grid-cols-2">
                <div>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300">Praised</p>
                  <ul className="mt-1 list-disc pl-5 text-slate-600 dark:text-slate-300">
                    {(c.themes?.positive || []).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-rose-700 dark:text-rose-300">Complaints</p>
                  <ul className="mt-1 list-disc pl-5 text-slate-600 dark:text-slate-300">
                    {(c.themes?.negative || []).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
            {c.lastAnalyzedAt ? (
              <p className="mt-2 text-xs text-slate-500">Last analyzed: {new Date(c.lastAnalyzedAt).toLocaleString('en-IN')}</p>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  )
}
