'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Copy, ExternalLink, MessageCircle, QrCode, Share2 } from 'lucide-react'
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
  const [automationEnabled, setAutomationEnabled] = useState(false)
  const [automationTemplate, setAutomationTemplate] = useState('')
  const [automationSaving, setAutomationSaving] = useState(false)

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

      const v2 = await fetch(`/api/locations/${id}/v2-settings`)
      const v2json = await v2.json().catch(() => ({}))
      const auto = v2json?.data?.reviewRequestAutomation
      if (auto) {
        setAutomationEnabled(Boolean(auto.enabled))
        setAutomationTemplate(
          auto.bodyTemplate ||
            `Gentle reminder: if you enjoyed ${loc?.name || 'our outlet'}, a quick Google review helps us grow. Thank you!`
        )
      }
      setLoading(false)
    }
    run()
  }, [id])

  const saveAutomation = async () => {
    setAutomationSaving(true)
    try {
      const res = await fetch(`/api/locations/${id}/v2-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewRequestAutomation: {
            enabled: automationEnabled,
            bodyTemplate: automationTemplate.trim(),
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Save failed')
        return
      }
      toast.success('Weekly owner nudge saved')
    } finally {
      setAutomationSaving(false)
    }
  }

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
  const googleReviewUrl = placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : ''

  // One-tap WhatsApp deep-link — opens wa.me with pre-filled message
  const reviewRequestMsg = name
    ? `Hi! We loved having you at *${name}*. Could you spare 1 min to leave us a Google review? It really helps small businesses like ours 🙏\n\n👉 ${tracker || googleReviewUrl}`
    : ''
  const waShareLink = reviewRequestMsg
    ? `https://wa.me/?text=${encodeURIComponent(reviewRequestMsg)}`
    : ''
  const smsShareLink = reviewRequestMsg
    ? `sms:?body=${encodeURIComponent(reviewRequestMsg)}`
    : ''

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

      {/* ONE-TAP REVIEW REQUEST LINK */}
      <Card className="space-y-4 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-5 w-5 text-indigo-500" />
            One-tap Review Request Link
          </CardTitle>
          <CardDescription className="mt-1">
            Share a pre-filled WhatsApp or SMS message with your tracker link directly to happy customers — no QR scanner needed.
          </CardDescription>
        </div>

        {!planOk ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            Upgrade to a paid plan to unlock this feature.
          </p>
        ) : !tracker && !googleReviewUrl ? (
          <p className="text-xs text-slate-500">Set up a Google Place ID above to generate links.</p>
        ) : (
          <>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
              {reviewRequestMsg || '—'}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-xl gap-1.5"
                onClick={() => {
                  void navigator.clipboard.writeText(tracker || googleReviewUrl)
                  toast.success('Review link copied!')
                }}
              >
                <Copy className="h-4 w-4" />
                Copy link
              </Button>
              <Button
                variant="outline"
                className="rounded-xl gap-1.5"
                onClick={() => {
                  void navigator.clipboard.writeText(reviewRequestMsg)
                  toast.success('Message copied!')
                }}
              >
                <Copy className="h-4 w-4" />
                Copy message
              </Button>
              {waShareLink ? (
                <a
                  href={waShareLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <MessageCircle className="h-4 w-4" />
                  Share via WhatsApp
                </a>
              ) : null}
              {smsShareLink ? (
                <a
                  href={smsShareLink}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                >
                  <ExternalLink className="h-4 w-4" />
                  Send via SMS
                </a>
              ) : null}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tip: Send this after a great customer interaction — the personalised message gets 3× more clicks than a plain link.
            </p>
          </>
        )}
      </Card>

      <Card className="space-y-3 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <CardTitle className="text-base">Weekly owner nudge (B2)</CardTitle>
        <CardDescription>
          Every Monday, ReviewPulse sends you a WhatsApp reminder on your saved number — so you can ask happy customers for Google reviews. This does not message customers directly (Twilio template rules).
        </CardDescription>
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-600 dark:bg-slate-950/40">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Enable weekly nudge</span>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            checked={automationEnabled}
            onChange={(e) => setAutomationEnabled(e.target.checked)}
            disabled={!planOk}
          />
        </label>
        <textarea
          rows={3}
          value={automationTemplate}
          onChange={(e) => setAutomationTemplate(e.target.value)}
          disabled={!planOk}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800/80"
        />
        <Button className="rounded-xl" disabled={!planOk || automationSaving} onClick={() => void saveAutomation()}>
          {automationSaving ? 'Saving…' : 'Save automation'}
        </Button>
      </Card>

      <Card className="space-y-3 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <CardTitle className="text-base">Customer WhatsApp template</CardTitle>
        <CardDescription>Copy-paste to ask customers directly for a Google review.</CardDescription>
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
