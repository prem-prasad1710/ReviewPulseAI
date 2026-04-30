'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Copy, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

type Meta = {
  name?: string
  locationSlug?: string
  businessType?: string
  complianceMode?: string
  crisisMode?: boolean
  viewerPlan?: string
}

const businessTypes = ['restaurant', 'clinic', 'salon', 'retail', 'hotel', 'gym', 'school', 'other'] as const
const complianceModes = ['standard', 'healthcare', 'legal', 'finance'] as const

export default function GrowthToolsPanel({ locationId }: { locationId: string }) {
  const [meta, setMeta] = useState<Meta | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const res = await fetch(`/api/locations/${locationId}/meta`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (!cancelled) toast.error(json?.error || 'Failed to load location')
        return
      }
      if (!cancelled) setMeta(json?.data || null)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [locationId])

  const slug = meta?.locationSlug || ''
  const badgePath = slug ? `/api/badge/${encodeURIComponent(slug)}` : ''
  const schemaPath = slug ? `/api/schema/${encodeURIComponent(slug)}` : ''
  const exportUrl = `/api/export/${encodeURIComponent(locationId)}`

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  const saveVertical = async (patch: Partial<Meta>) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/locations/${locationId}/meta`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Save failed')
        return
      }
      setMeta((m) => ({ ...m, ...json?.data }))
      toast.success('Saved')
    } finally {
      setBusy(false)
    }
  }

  if (!meta) {
    return <p className="text-sm text-slate-500">Loading…</p>
  }

  const paid = meta.viewerPlan && meta.viewerPlan !== 'free'

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <Link href="/locations" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Locations
      </Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">v2 Growth tools</p>
        <h1 className="font-heading mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
          <Share2 className="h-7 w-7 text-indigo-600" />
          Embeds &amp; export
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Public badge (SVG), JSON-LD schema for your site, CSV export, and vertical / compliance flags from the mega
          roadmap.
        </p>
      </div>

      <Card className="space-y-4 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <CardTitle className="text-base dark:text-slate-100">Business profile (v2)</CardTitle>
        <CardDescription>Used for journey mapping and compliance-aware AI (F3 / D2).</CardDescription>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Vertical
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
              value={meta.businessType || 'other'}
              disabled={busy}
              onChange={(e) => void saveVertical({ businessType: e.target.value })}
            >
              {businessTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Compliance mode
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
              value={meta.complianceMode || 'standard'}
              disabled={busy}
              onChange={(e) => void saveVertical({ complianceMode: e.target.value })}
            >
              {complianceModes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/40 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-950/20">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Crisis mode (pause scheduled replies)</span>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            checked={Boolean(meta.crisisMode)}
            disabled={busy}
            onChange={(e) => void saveVertical({ crisisMode: e.target.checked })}
          />
        </label>
      </Card>

      {!slug ? (
        <Card className="p-6 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">This location has no public slug yet — sync once from Locations.</p>
        </Card>
      ) : (
        <>
          <Card className="space-y-3 p-6 dark:border-slate-700 dark:bg-slate-900/60">
            <CardTitle className="text-base dark:text-slate-100">Trust badge (SVG)</CardTitle>
            <CardDescription>Hotlinked image updates about hourly (CDN cache). H1 from roadmap.</CardDescription>
            {badgePath ? (
              <div className="space-y-2">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-950/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={badgePath} alt="ReviewPulse rating badge" className="max-w-full" />
                </div>
                <code className="block break-all rounded-lg bg-slate-100 px-3 py-2 text-xs dark:bg-slate-800">{`<img src="${badgePath}" width="280" height="52" alt="Reviews verified by ReviewPulse" />`}</code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => {
                    const prefix = typeof window !== 'undefined' ? window.location.origin : ''
                    void copy(
                      `<img src="${prefix}${badgePath}" width="280" height="52" alt="Reviews verified by ReviewPulse" />`
                    )
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy HTML (absolute URL)
                </Button>
              </div>
            ) : null}
          </Card>

          <Card className="space-y-3 p-6 dark:border-slate-700 dark:bg-slate-900/60">
            <CardTitle className="text-base dark:text-slate-100">JSON-LD schema (E4)</CardTitle>
            <CardDescription>Link or fetch in your site head for rich results (Google may still validate).</CardDescription>
            {schemaPath ? (
              <>
                <a href={schemaPath} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600 hover:underline">
                  Open {schemaPath}
                </a>
                <code className="block break-all rounded-lg bg-slate-100 px-3 py-2 text-xs dark:bg-slate-800">{`<script type="application/ld+json" src="${schemaPath}"></script>`}</code>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Prefer pasting JSON from the URL into a <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">script type=&quot;application/ld+json&quot;</code> block if your CMS strips cross-origin script src.
                </p>
              </>
            ) : null}
          </Card>
        </>
      )}

      <Card className="space-y-3 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <CardTitle className="text-base dark:text-slate-100">CSV export (G4)</CardTitle>
        <CardDescription>Starter+ only. Downloads all reviews for this outlet.</CardDescription>
        {paid ? (
          <a
            href={exportUrl}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1f56c8]"
          >
            Download CSV
          </a>
        ) : (
          <p className="text-sm text-amber-800 dark:text-amber-200">Upgrade to Starter or above to export.</p>
        )}
      </Card>
    </div>
  )
}
