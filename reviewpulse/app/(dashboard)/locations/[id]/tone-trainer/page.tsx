'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function ToneTrainerPage() {
  const params = useParams()
  const id = String(params.id)
  const [loading, setLoading] = useState(true)
  const [planOk, setPlanOk] = useState(false)
  const [examples, setExamples] = useState<string[]>([])
  const [previewTone, setPreviewTone] = useState('')
  const [previewDefault, setPreviewDefault] = useState('')
  const [reviewId, setReviewId] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const run = async () => {
      const res = await fetch(`/api/locations/${id}/tone-examples`)
      const json = await res.json()
      setExamples(json?.data?.examples || [])
      setPlanOk(Boolean(json?.data?.planOk))
      setLoading(false)
    }
    run()
  }, [id])

  const save = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/locations/${id}/tone-examples`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examples: examples.filter(Boolean).slice(0, 10) }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Save failed')
        return
      }
      setExamples(json?.data?.examples || [])
      toast.success('Tone examples saved')
    } finally {
      setBusy(false)
    }
  }

  const runPreview = async (skipToneExamples: boolean) => {
    if (!reviewId.trim()) {
      toast.message('Paste a review ID from your inbox for preview')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/ai/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: reviewId.trim(),
          language: 'english',
          tone: 'professional',
          skipToneExamples,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Generate failed')
        return
      }
      const reply = json?.data?.reply || ''
      if (skipToneExamples) setPreviewDefault(reply)
      else setPreviewTone(reply)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <Link
        href="/locations"
        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Locations
      </Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          Feature 1
        </p>
        <h1 className="font-heading mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">Reply Tone Trainer</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Paste up to 10 of your best past replies so AI matches your voice on Growth and Scale plans.
        </p>
      </div>

      {!planOk ? (
        <Card className="border-amber-200/80 bg-amber-50/60 p-6 dark:border-amber-800/50 dark:bg-amber-950/30">
          <CardTitle className="text-base dark:text-amber-100">Upgrade to Growth or Scale</CardTitle>
          <CardDescription className="text-amber-900/90 dark:text-amber-200/90">
            Tone Trainer is gated for Growth and Scale. You can still browse this page—upgrade to save examples.
          </CardDescription>
          <Link
            href="/settings"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#2563EB] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#1f56c8]"
          >
            View plans
          </Link>
        </Card>
      ) : null}

      <Card className="space-y-4 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <CardTitle className="flex items-center gap-2 text-lg dark:text-slate-100">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          Your examples ({examples.length}/10)
        </CardTitle>
        {examples.map((ex, i) => (
          <textarea
            key={i}
            value={ex}
            disabled={!planOk}
            onChange={(e) => {
              const next = [...examples]
              next[i] = e.target.value
              setExamples(next)
            }}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
          />
        ))}
        {examples.length < 10 ? (
          <Button
            type="button"
            variant="outline"
            disabled={!planOk}
            className="rounded-xl"
            onClick={() => setExamples([...examples, ''])}
          >
            Add example
          </Button>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-xl" disabled={!planOk || busy} onClick={save}>
            Save examples
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl"
            disabled={!planOk || busy}
            onClick={() => setExamples((e) => e.slice(0, -1))}
          >
            Remove last
          </Button>
        </div>
      </Card>

      <Card className="space-y-3 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <CardTitle className="text-lg dark:text-slate-100">Live preview</CardTitle>
        <CardDescription>Compare tone-tuned vs default draft for any review in your inbox.</CardDescription>
        <input
          value={reviewId}
          onChange={(e) => setReviewId(e.target.value)}
          placeholder="Review Mongo _id from /reviews"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="rounded-xl" disabled={busy} onClick={() => runPreview(false)}>
            Preview with tone
          </Button>
          <Button type="button" variant="outline" className="rounded-xl" disabled={busy} onClick={() => runPreview(true)}>
            Preview default
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Tone-tuned</p>
            <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/80">{previewTone || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Default</p>
            <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/80">{previewDefault || '—'}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
