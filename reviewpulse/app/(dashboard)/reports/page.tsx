'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Cloud,
  CloudOff,
  Download,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ReportRow {
  locationName: string
  month: string
  url: string
  emailedOnly?: boolean
  generatedAt: string
}

interface Loc {
  _id: string
  name: string
  address?: string
}

function parseFilenameFromDisposition(header: string | null): string | undefined {
  if (!header) return undefined
  const m = /filename\*?=(?:UTF-8''|")?([^";\n]+)/i.exec(header)
  return m?.[1]?.replace(/"/g, '')?.trim()
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reports, setReports] = useState<ReportRow[]>([])
  const [locations, setLocations] = useState<Loc[]>([])
  const [locId, setLocId] = useState('')
  const [busy, setBusy] = useState(false)
  const [blobConfigured, setBlobConfigured] = useState<boolean | null>(null)

  const refreshLists = useCallback(async () => {
    const [r1, r2, r3] = await Promise.all([
      fetch('/api/reports/list'),
      fetch('/api/locations'),
      fetch('/api/reports/status'),
    ])
    if (!r1.ok) {
      const j = await r1.json().catch(() => ({}))
      throw new Error(j?.error || 'Could not load reports')
    }
    if (!r2.ok) {
      const j = await r2.json().catch(() => ({}))
      throw new Error(j?.error || 'Could not load locations')
    }
    const j1 = await r1.json()
    const j2 = await r2.json()
    setReports(j1?.data?.reports || [])
    const locs: Loc[] = j2?.data || []
    setLocations(locs)
    setLocId((prev) => {
      if (prev && locs.some((l) => String(l._id) === prev)) return prev
      return locs[0]?._id ? String(locs[0]._id) : ''
    })
    if (r3.ok) {
      const j3 = await r3.json()
      setBlobConfigured(Boolean(j3?.data?.blobConfigured))
    } else {
      setBlobConfigured(null)
    }
  }, [])

  useEffect(() => {
    const run = async () => {
      setLoadError(null)
      try {
        await refreshLists()
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [refreshLists])

  const generate = async () => {
    if (!locId) {
      toast.error('Add a location first, then pick it from the list.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: locId }),
      })
      const ct = res.headers.get('content-type') || ''

      if (ct.includes('application/pdf')) {
        const blob = await res.blob()
        const fallback = `reviewpulse-report-${new Date().toISOString().slice(0, 10)}.pdf`
        const filename =
          parseFilenameFromDisposition(res.headers.get('content-disposition')) || fallback
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.rel = 'noopener'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        toast.success('PDF downloaded', {
          description: blobConfigured
            ? undefined
            : 'Add BLOB_READ_WRITE_TOKEN on Vercel to keep copies in Past reports.',
        })
        await refreshLists()
        return
      }

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json?.error || 'Generate failed')
        return
      }
      toast.success('Report saved to the cloud', { description: 'Open Past reports to download anytime.' })
      await refreshLists()
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-6">
      {loadError ? (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
          {loadError}{' '}
          <button
            type="button"
            className="ml-2 font-semibold text-amber-950 underline dark:text-amber-50"
            onClick={() => {
              setLoading(true)
              setLoadError(null)
              void refreshLists()
                .catch((e) => setLoadError(e instanceof Error ? e.message : 'Failed'))
                .finally(() => setLoading(false))
            }}
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-700 p-6 text-white shadow-xl shadow-indigo-900/25 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-cyan-300/15 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-100">
              <Sparkles className="h-3.5 w-3.5" />
              Reputation exports
            </div>
            <h1 className="font-heading flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <FileText className="h-6 w-6" />
              </span>
              Monthly PDF reports
            </h1>
            <p className="text-sm leading-relaxed text-indigo-100 sm:text-base">
              One-click reputation snapshot: score, reply rate, sentiment mix, and executive summary—ready for
              investors or franchise reviews.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {blobConfigured === true ? (
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-medium backdrop-blur-sm">
                <Cloud className="h-4 w-4 shrink-0 text-emerald-200" />
                Cloud storage on
              </span>
            ) : blobConfigured === false ? (
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-medium backdrop-blur-sm">
                <CloudOff className="h-4 w-4 shrink-0 text-amber-200" />
                Direct download mode
              </span>
            ) : null}
            <span className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-medium backdrop-blur-sm">
              Manual: 1 / location / day
            </span>
          </div>
        </div>
      </div>

      <Card className="relative overflow-hidden border-slate-200/80 p-0 shadow-lg dark:border-slate-700 dark:bg-slate-900/70">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/50 sm:px-6">
          <CardTitle className="text-base text-slate-900 dark:text-slate-100">Generate report</CardTitle>
          <CardDescription className="mt-1 text-xs sm:text-sm">
            {blobConfigured === false
              ? 'Without BLOB_READ_WRITE_TOKEN, we generate a secure PDF download. Add the token on Vercel to archive copies below.'
              : 'PDFs are built from synced reviews for the selected outlet.'}
          </CardDescription>
        </div>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:flex-wrap sm:items-end sm:gap-5 sm:p-6">
          <div className="min-w-0 flex-1 sm:min-w-[240px]">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Location
            </label>
            <select
              value={locId}
              onChange={(e) => setLocId(e.target.value)}
              disabled={locations.length === 0}
              className={cn(
                'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-950/80 dark:text-slate-100',
                locations.length === 0 && 'cursor-not-allowed opacity-60'
              )}
            >
              {locations.length === 0 ? (
                <option value="">No locations connected</option>
              ) : (
                locations.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="rounded-xl bg-indigo-600 px-5 hover:bg-indigo-700"
              disabled={busy || !locId}
              onClick={() => void generate()}
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate PDF
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-slate-300 dark:border-slate-600"
              disabled={busy}
              onClick={() => {
                setLoading(true)
                setLoadError(null)
                void refreshLists()
                  .catch((e) => setLoadError(e instanceof Error ? e.message : 'Failed'))
                  .finally(() => setLoading(false))
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
        {locations.length === 0 ? (
          <div className="border-t border-slate-100 bg-indigo-50/50 px-5 py-6 dark:border-slate-700 dark:bg-indigo-950/20 sm:px-6">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Connect Google Business Profile</p>
            <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">
              Locations are imported when you sign in with Google. Open Locations to connect or re-import your
              outlets.
            </p>
            <Link
              href="/api/auth/signin/google?callbackUrl=/locations"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#1f56c8]"
            >
              <MapPin className="h-4 w-4" />
              Connect Google &amp; import locations
              <ArrowRight className="h-4 w-4 opacity-90" />
            </Link>
          </div>
        ) : null}
      </Card>

      <Card className="overflow-hidden border-slate-200/80 shadow-md dark:border-slate-700 dark:bg-slate-900/70">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/50 sm:px-6">
          <CardTitle className="text-base text-slate-900 dark:text-slate-100">Past reports</CardTitle>
          <CardDescription className="mt-1 text-xs sm:text-sm">
            Download links for PDFs stored on Vercel Blob. Email-only cron runs appear as “Emailed”.
          </CardDescription>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {reports.length === 0 ? (
            <li className="px-5 py-14 text-center sm:px-6">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No archived PDFs yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Generate above—once Blob is configured, each run appears here with a permanent link.
              </p>
            </li>
          ) : null}
          {reports.map((r) => (
            <li
              key={`${r.locationName}-${r.month}-${String(r.generatedAt)}`}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100">{r.locationName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {r.month} · {new Date(r.generatedAt).toLocaleString('en-IN')}
                </p>
              </div>
              {r.emailedOnly ? (
                <span className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Emailed (no Blob URL)
                </span>
              ) : r.url ? (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-slate-300/90 bg-white px-4 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Download
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        <Link href="/settings" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Plan &amp; billing
        </Link>
        {' · '}
        <Link href="/locations" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Locations
        </Link>
      </p>
    </div>
  )
}
