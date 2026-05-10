'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Download, Radio, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function OfflineBridgePage() {
  const params = useParams()
  const id = String(params.id)
  const [loading, setLoading] = useState(true)
  const [planOk, setPlanOk] = useState(false)
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [visits, setVisits] = useState(0)

  useEffect(() => {
    const run = async () => {
      const res = await fetch(`/api/locations/${id}`)
      const json = await res.json()
      const loc = json?.data
      setSlug(loc?.locationSlug || '')
      setName(loc?.name || '')
      setVisits(Number(loc?.bridgeVisits || 0))
      const p = loc?.viewerPlan as string | undefined
      setPlanOk(Boolean(p && p !== 'free'))
      setLoading(false)
    }
    run()
  }, [id])

  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const bridgeUrl = slug ? `${base}/r/visit/${slug}` : ''
  const publicVisit = slug ? `${base}/visit/${slug}` : ''

  const downloadPdf = async () => {
    const res = await fetch(`/api/locations/${id}/bridge-card`)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      toast.error(j?.error || 'Download failed')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `review-bridge-${name || 'card'}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Card downloaded')
  }

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
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Offline bridge</p>
        <h1 className="font-heading mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
          <Radio className="h-7 w-7 text-indigo-600" />
          NFC &amp; QR review starter
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Customers land on a friendly page with pre-filled text, then continue on Google. Paid plans: printable A6 card.
        </p>
      </div>

      {!planOk ? (
        <Card className="border-amber-200/80 bg-amber-50/60 p-6 dark:border-amber-800/50 dark:bg-amber-950/30">
          <CardTitle className="text-base">Upgrade to a paid plan</CardTitle>
          <CardDescription>Offline bridge analytics and printable cards unlock on Starter and above.</CardDescription>
        </Card>
      ) : null}

      <Card className="space-y-3 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <CardTitle className="text-base">Bridge visits</CardTitle>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{visits}</p>
        <CardDescription>Counted when customers open your visit page (includes today&apos;s date from the QR redirect).</CardDescription>
      </Card>

      <Card className="space-y-3 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          URLs
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400">Burn this into QR / NFC (always uses today&apos;s date):</p>
        <code className="block break-all rounded-lg bg-slate-100 px-2 py-2 text-xs dark:bg-slate-950">{bridgeUrl || '—'}</code>
        <p className="text-xs text-slate-500 dark:text-slate-400">Direct visit page (optional):</p>
        <code className="block break-all rounded-lg bg-slate-100 px-2 py-2 text-xs dark:bg-slate-950">{publicVisit || '—'}</code>
      </Card>

      {planOk ? (
        <Card className="space-y-4 p-6 dark:border-slate-700 dark:bg-slate-900/60">
          <CardTitle className="text-base">Printable A6 card</CardTitle>
          <Button className="rounded-xl" onClick={() => void downloadPdf()}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </Card>
      ) : null}

      <Card className="space-y-3 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <CardTitle className="text-base">NFC setup (quick)</CardTitle>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
          <li>Buy writable NFC tags (search “NFC NTAG213 stickers”).</li>
          <li>Install “NFC Tools” on iOS or Android.</li>
          <li>Write the URL above to the tag (URI record).</li>
          <li>Place the tag on your counter or receipt book.</li>
        </ol>
      </Card>
    </div>
  )
}
