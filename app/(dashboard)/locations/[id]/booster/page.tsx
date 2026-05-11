'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function BoosterPage() {
  const params = useParams()
  const id = String(params.id)
  const [loading, setLoading] = useState(true)
  const [planOk, setPlanOk] = useState(true)
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [placeId, setPlaceId] = useState('')

  useEffect(() => {
    const run = async () => {
      const res = await fetch(`/api/locations/${id}`)
      const json = await res.json()
      const loc = json?.data
      setSlug(loc?.locationSlug || '')
      setName(loc?.name || '')
      setPlaceId(loc?.googlePlaceId || '')
      const p = loc?.viewerPlan as string | undefined
      setPlanOk(Boolean(p && p !== 'free'))
      setLoading(false)
    }
    run()
  }, [id])

  const savePlaceId = async () => {
    const res = await fetch(`/api/locations/${id}/meta`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googlePlaceId: placeId.trim() }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json?.error || 'Save failed')
      return
    }
    toast.success('Google Place ID saved')
  }

  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const tracker = slug ? `${base}/r/${slug}` : ''
  const waTemplate = name
    ? `Namaste! Aapka ${name} mein aana bahut accha laga. Kya aap 1 minute mein hume Google review de sakte hain? Link: ${tracker}. Aapka feedback humare liye bahut important hai! 🙏`
    : ''

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full rounded-2xl" />
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
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Feature 4</p>
        <h1 className="font-heading mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
          <QrCode className="h-7 w-7 text-indigo-600" />
          Review Booster (Smart QR)
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Paid plans: downloadable QR, redirect tracker, WhatsApp template for proactive 5-star asks.
        </p>
      </div>

      {!planOk ? (
        <Card className="p-6">Upgrade to a paid plan to unlock Booster.</Card>
      ) : null}

      <Card className="space-y-3 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <CardTitle className="text-base">Google Place ID</CardTitle>
        <CardDescription>Required for QR and /r redirect to Google review compose.</CardDescription>
        <input
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          placeholder="ChIJ..."
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
        />
        <Button className="rounded-xl" onClick={savePlaceId}>
          Save Place ID
        </Button>
      </Card>

      <Card className="space-y-3 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <CardTitle className="text-base">Redirect tracker</CardTitle>
        <CardDescription>Each scan increments qrScans then 301s to Google.</CardDescription>
        <code className="block rounded-lg bg-slate-100 px-3 py-2 text-xs dark:bg-slate-800">{tracker || 'Save slug by saving location once'}</code>
      </Card>

      <Card className="space-y-3 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <CardTitle className="text-base">WhatsApp template</CardTitle>
        <textarea readOnly rows={4} value={waTemplate} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800/80" />
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            void navigator.clipboard.writeText(waTemplate)
            toast.success('Copied')
          }}
        >
          Copy template
        </Button>
      </Card>

      <a
        href={planOk ? `/api/locations/${id}/booster/qr` : undefined}
        download
        className={`inline-flex h-10 items-center justify-center rounded-xl bg-[#2563EB] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#1f56c8] ${!planOk ? 'pointer-events-none opacity-50' : ''}`}
      >
        Download QR (PNG)
      </a>
    </div>
  )
}
