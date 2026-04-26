'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ReportRow {
  locationName: string
  month: string
  url: string
  generatedAt: string
}

interface Loc {
  _id: string
  name: string
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<ReportRow[]>([])
  const [locations, setLocations] = useState<Loc[]>([])
  const [locId, setLocId] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const run = async () => {
      const [r1, r2] = await Promise.all([fetch('/api/reports/list'), fetch('/api/locations')])
      const j1 = await r1.json()
      const j2 = await r2.json()
      setReports(j1?.data?.reports || [])
      setLocations(j2?.data || [])
      const first = (j2?.data || [])[0]?._id
      if (first) setLocId(String(first))
      setLoading(false)
    }
    run()
  }, [])

  const generate = async () => {
    if (!locId) {
      toast.message('Select a location')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: locId }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Generate failed')
        return
      }
      toast.success('Report ready')
      const r = await fetch('/api/reports/list')
      const j = await r.json()
      setReports(j?.data?.reports || [])
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          Feature 10
        </p>
        <h1 className="font-heading mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
          <FileText className="h-7 w-7 text-indigo-600" />
          Monthly PDF reports
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Generate a professional PDF (stored on Vercel Blob when configured). Scale plan: automate via monthly cron
          hook. Rate limit: one manual generate per day per location.
        </p>
      </div>

      <Card className="flex flex-wrap items-end gap-3 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <div className="min-w-[200px] flex-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Location</label>
          <select
            value={locId}
            onChange={(e) => setLocId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
          >
            {locations.map((l) => (
              <option key={l._id} value={l._id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <Button className="rounded-xl" disabled={busy} onClick={generate}>
          {busy ? 'Generating…' : 'Generate now'}
        </Button>
        <CardDescription className="w-full text-xs">
          Requires <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">BLOB_READ_WRITE_TOKEN</code>.
        </CardDescription>
      </Card>

      <Card className="p-0 overflow-hidden dark:border-slate-700 dark:bg-slate-900/60">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
          <CardTitle className="text-base dark:text-slate-100">Past reports</CardTitle>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {reports.length === 0 ? (
            <li className="px-6 py-10 text-center text-sm text-slate-500">No PDFs yet.</li>
          ) : null}
          {reports.map((r) => (
            <li key={r.url} className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{r.locationName}</p>
                <p className="text-xs text-slate-500">
                  {r.month} · {new Date(r.generatedAt).toLocaleString('en-IN')}
                </p>
              </div>
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center justify-center rounded-xl border border-slate-300/90 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      </Card>

      <p className="text-center text-xs text-slate-500">
        <Link href="/settings" className="text-indigo-600 hover:underline dark:text-indigo-400">
          Plan &amp; billing
        </Link>
      </p>
    </div>
  )
}
