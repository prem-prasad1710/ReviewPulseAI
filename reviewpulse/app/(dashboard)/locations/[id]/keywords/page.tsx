'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Kw {
  keyword: string
  type: 'crisis' | 'positive'
  enabled: boolean
}

export default function KeywordsPage() {
  const params = useParams()
  const id = String(params.id)
  const [loading, setLoading] = useState(true)
  const [planOk, setPlanOk] = useState(false)
  const [keywords, setKeywords] = useState<Kw[]>([])
  const [alerts, setAlerts] = useState<Array<{ keyword: string; createdAt: string }>>([])
  const [draft, setDraft] = useState('')
  const [draftType, setDraftType] = useState<'crisis' | 'positive'>('crisis')

  const load = async () => {
    const res = await fetch(`/api/locations/${id}/alert-keywords`)
    const json = await res.json()
    setKeywords(json?.data?.keywords || [])
    setAlerts(json?.data?.recentAlerts || [])
    setPlanOk(Boolean(json?.data?.planOk))
    setLoading(false)
  }

  useEffect(() => {
    queueMicrotask(() => {
      void load()
    })
  }, [id])

  const save = async (next: Kw[]) => {
    const res = await fetch(`/api/locations/${id}/alert-keywords`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: next }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json?.error || 'Save failed')
      return
    }
    const saved = json?.data?.keywords || []
    setKeywords(saved)
    toast.success('Keywords saved')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-36 w-full rounded-2xl" />
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
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Feature 8</p>
        <h1 className="font-heading mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
          <Bell className="h-7 w-7 text-indigo-600" />
          Keyword Alert Engine
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Growth &amp; Scale: email + optional WhatsApp when reviews match your keywords.
        </p>
      </div>

      {!planOk ? (
        <Card className="border-amber-200/80 bg-amber-50/60 p-6 dark:border-amber-800/50 dark:bg-amber-950/30">
          <CardTitle className="text-base">Upgrade to Growth or Scale</CardTitle>
          <CardDescription>Keyword alerts are a paid growth feature.</CardDescription>
        </Card>
      ) : null}

      <Card className="space-y-3 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <CardTitle className="text-base">Add keyword</CardTitle>
        <div className="flex flex-wrap gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. cockroach"
            className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
          />
          <select
            value={draftType}
            onChange={(e) => setDraftType(e.target.value as 'crisis' | 'positive')}
            className="rounded-xl border border-slate-200 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
          >
            <option value="crisis">Crisis</option>
            <option value="positive">Positive</option>
          </select>
          <Button
            className="rounded-xl"
            disabled={!planOk || !draft.trim()}
            onClick={() => {
              const next = [...keywords, { keyword: draft.trim(), type: draftType, enabled: true }]
              setDraft('')
              void save(next)
            }}
          >
            Add
          </Button>
        </div>
      </Card>

      <Card className="p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <CardTitle className="text-base">Active keywords</CardTitle>
        <ul className="mt-3 space-y-2">
          {keywords.map((k, idx) => (
            <li
              key={`${k.keyword}-${idx}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-700"
            >
              <span>
                <span className="font-medium">{k.keyword}</span>{' '}
                <span className="text-xs uppercase text-slate-500">({k.type})</span>
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  disabled={!planOk}
                  onClick={() => {
                    const next = [...keywords]
                    next[idx] = { ...k, enabled: !k.enabled }
                    void save(next)
                  }}
                >
                  {k.enabled ? 'On' : 'Off'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-lg"
                  disabled={!planOk}
                  onClick={() => {
                    const next = keywords.filter((_, i) => i !== idx)
                    void save(next)
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <CardTitle className="text-base">Recent alerts (30 days)</CardTitle>
        <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {alerts.length === 0 ? <li className="text-slate-500">No alerts yet.</li> : null}
          {alerts.map((a) => (
            <li key={`${a.keyword}-${a.createdAt}`}>
              <span className="font-medium">{a.keyword}</span> · {new Date(a.createdAt).toLocaleString('en-IN')}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
