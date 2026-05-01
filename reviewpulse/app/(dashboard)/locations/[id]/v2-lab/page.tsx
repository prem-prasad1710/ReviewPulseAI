'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { stagesForBusinessType } from '@/lib/journeyStages'
import { Button } from '@/components/ui/button'

type Tab = 'emotion' | 'predict' | 'fans' | 'bench' | 'surveys' | 'journey' | 'exports'

export default function LocationV2LabPage() {
  const params = useParams()
  const id = String(params?.id || '')
  const [tab, setTab] = useState<Tab>('emotion')
  const [businessType, setBusinessType] = useState<string>('other')
  const [emotion, setEmotion] = useState<Record<string, number> | null>(null)
  const [predict, setPredict] = useState<unknown>(null)
  const [fans, setFans] = useState<unknown[]>([])
  const [bench, setBench] = useState<unknown>(null)
  const [surveys, setSurveys] = useState<unknown[]>([])
  const [v2settings, setV2settings] = useState<{
    reviewRemovalAlertAt?: string
    managedReplyQueue?: boolean
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const metaRes = await fetch(`/api/locations/${id}/meta`)
      const metaJ = await metaRes.json().catch(() => ({}))
      if (!cancelled && metaRes.ok && metaJ?.data?.businessType) {
        setBusinessType(String(metaJ.data.businessType))
      }

      setErr(null)
      if (tab === 'emotion') {
        const res = await fetch(`/api/locations/${id}/emotion-heatmap`)
        const j = await res.json().catch(() => ({}))
        if (!cancelled) {
          if (!res.ok) setErr(j?.error || 'Failed')
          else setEmotion(j?.data?.byEmotion || {})
        }
      }
      if (tab === 'predict') {
        const res = await fetch(`/api/locations/${id}/predictions`)
        const j = await res.json().catch(() => ({}))
        if (!cancelled) {
          if (!res.ok) setErr(j?.error || 'Failed')
          else setPredict(j?.data || null)
        }
      }
      if (tab === 'fans') {
        const res = await fetch(`/api/locations/${id}/super-fans`)
        const j = await res.json().catch(() => ({}))
        if (!cancelled) {
          if (!res.ok) setErr(j?.error || 'Failed')
          else setFans((j?.data?.superfans as unknown[]) || [])
        }
      }
      if (tab === 'bench') {
        const res = await fetch(`/api/locations/${id}/benchmark`)
        const j = await res.json().catch(() => ({}))
        if (!cancelled) {
          if (!res.ok) setErr(j?.error || 'Failed')
          else setBench(j?.data || null)
        }
      }
      if (tab === 'surveys') {
        const res = await fetch(`/api/locations/${id}/surveys`)
        const j = await res.json().catch(() => ({}))
        if (!cancelled) {
          if (!res.ok) setErr(j?.error || 'Failed')
          else setSurveys((j?.data?.surveys as unknown[]) || [])
        }
      }

      const s = await fetch(`/api/locations/${id}/v2-settings`)
      const sj = await s.json().catch(() => ({}))
      if (!cancelled && s.ok && sj?.data) {
        setV2settings({
          reviewRemovalAlertAt: sj.data.reviewRemovalAlertAt,
          managedReplyQueue: sj.data.managedReplyQueue,
        })
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [id, tab])

  const genReel = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/locations/${id}/highlight-reel`, { method: 'POST' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) setErr(j?.error || 'Failed')
      else alert('Highlight reel manifest saved on location.')
    } finally {
      setBusy(false)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'emotion', label: 'A1 Emotion' },
    { key: 'predict', label: 'A2 Predict' },
    { key: 'fans', label: 'F2 Super fans' },
    { key: 'bench', label: 'C2 Benchmark' },
    { key: 'surveys', label: 'F4 Surveys' },
    { key: 'journey', label: 'A4 Journey' },
    { key: 'exports', label: 'PDFs & CSV' },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">ReviewPulse v2 lab</p>
      <h1 className="mt-1 font-heading text-2xl font-bold text-slate-900 dark:text-slate-50">Intelligence & growth</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Outlet-scoped tools (Growth+ where noted).{' '}
        <Link href={`/locations/${id}/growth-tools`} className="font-semibold text-indigo-600 underline">
          Growth tools
        </Link>{' '}
        ·{' '}
        <Link href={`/locations/${id}/heatmap`} className="font-semibold text-indigo-600 underline">
          Mood heatmap (C4)
        </Link>
      </p>

      {v2settings?.reviewRemovalAlertAt ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
          D1 removal signal: GBP count dropped on last sync ({new Date(v2settings.reviewRemovalAlertAt).toLocaleString()}).
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              tab === t.key
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {err ? <p className="mt-4 text-sm text-red-600">{err}</p> : null}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950/50">
        {tab === 'emotion' && emotion ? (
          <ul className="space-y-2 text-sm">
            {Object.entries(emotion).map(([k, v]) => (
              <li key={k}>
                <strong>{k}</strong>: {v}
              </li>
            ))}
            {Object.keys(emotion).length === 0 ? <li>No emotions classified yet — sync reviews (Growth+).</li> : null}
          </ul>
        ) : null}

        {tab === 'predict' && predict ? (
          <pre className="max-h-[420px] overflow-auto text-xs">{JSON.stringify(predict, null, 2)}</pre>
        ) : null}

        {tab === 'fans' ? (
          <ul className="space-y-2 text-sm">
            {(fans as { _id?: string; count?: number; lastAt?: string }[]).map((f) => (
              <li key={f._id}>
                {f._id} — {f.count}× five-star
              </li>
            ))}
            {fans.length === 0 ? <li>No repeat superfans yet.</li> : null}
          </ul>
        ) : null}

        {tab === 'bench' && bench ? (
          <pre className="text-xs">{JSON.stringify(bench, null, 2)}</pre>
        ) : null}

        {tab === 'surveys' ? (
          <div className="space-y-3 text-sm">
            {(surveys as { slug?: string; title?: string; _id?: string }[]).map((s) => (
              <div key={String(s._id)} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                <span>{s.title}</span>
                <a
                  className="text-indigo-600 underline"
                  href={`/s/${encodeURIComponent(s.slug || '')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Public link
                </a>
              </div>
            ))}
            {surveys.length === 0 ? <p>No surveys — create via API or future form.</p> : null}
          </div>
        ) : null}

        {tab === 'journey' ? (
          <ul className="list-inside list-disc text-sm text-slate-700 dark:text-slate-300">
            {stagesForBusinessType(businessType).map((st) => (
              <li key={st}>{st}</li>
            ))}
          </ul>
        ) : null}

        {tab === 'exports' ? (
          <div className="flex flex-col gap-3 text-sm">
            <a
              className="font-semibold text-indigo-600 underline"
              href={`/api/locations/${id}/battle-card/pdf`}
              target="_blank"
              rel="noreferrer"
            >
              A3 Battle card PDF
            </a>
            <a
              className="font-semibold text-indigo-600 underline"
              href={`/api/locations/${id}/investor-report/pdf`}
              target="_blank"
              rel="noreferrer"
            >
              C6 Investor PDF
            </a>
            <a className="font-semibold text-indigo-600 underline" href={`/api/export/${id}`} target="_blank" rel="noreferrer">
              G3 CSV export
            </a>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void genReel()}>
              F1 Generate highlight reel manifest
            </Button>
            <a className="font-semibold text-indigo-600 underline" href={`/api/locations/${id}/brand-voice`}>
              D3 Brand voice JSON
            </a>
          </div>
        ) : null}
      </div>
    </div>
  )
}
