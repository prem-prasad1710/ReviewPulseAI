'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import SocialPostModal from '@/components/reviews/SocialPostModal'

const languages = [
  { id: 'english' as const, label: 'English' },
  { id: 'hindi' as const, label: 'Hindi' },
  { id: 'hinglish' as const, label: 'Hinglish' },
]

const tones: { id: 'professional' | 'friendly' | 'formal' | 'grateful' | 'concise'; label: string }[] = [
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'formal', label: 'Formal' },
  { id: 'grateful', label: 'Grateful' },
  { id: 'concise', label: 'Concise' },
]

type ReviewDetail = {
  _id: string
  reviewerName: string
  rating: number
  comment?: string
  fakeScore?: number
  fakeSignals?: string[]
  autopsy?: { rootCause: string; suggestedFix: string; generatedAt: string }
}

export default function ReplyModal({
  reviewId,
  open,
  onClose,
}: {
  reviewId: string | null
  open: boolean
  onClose: () => void
}) {
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState<'hindi' | 'english' | 'hinglish'>('english')
  const [tone, setTone] = useState<'professional' | 'friendly' | 'formal' | 'grateful' | 'concise'>('professional')
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState<ReviewDetail | null>(null)
  const [gates, setGates] = useState<{ autopsy?: boolean; socialFull?: boolean; fakeScore?: boolean }>({})
  const [locationName, setLocationName] = useState('')
  const [autopsyOpen, setAutopsyOpen] = useState(true)
  const [socialOpen, setSocialOpen] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      if (!open || !reviewId) {
        setDetail(null)
        setGates({})
        setLocationName('')
        return
      }
      void (async () => {
        setDetailLoading(true)
        try {
          const res = await fetch(`/api/reviews/${reviewId}`)
          const json = await res.json()
          setDetail(json?.data?.review || null)
          setGates(json?.data?.gates || {})
          setLocationName(json?.data?.location?.name || '')
        } finally {
          setDetailLoading(false)
        }
      })()
    })
  }, [open, reviewId])

  if (!open || !reviewId) return null

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, language, tone }),
      })
      const json = await res.json()
      setReply(json?.data?.reply || '')
    } finally {
      setLoading(false)
    }
  }

  const publish = async () => {
    setLoading(true)
    try {
      await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyText: reply }),
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const fakeScore = detail?.fakeScore
  const fakeSignals = detail?.fakeSignals || []
  const trustBadge =
    gates.fakeScore && typeof fakeScore === 'number' && fakeScore >= 70
      ? { label: 'Suspicious', className: 'bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-200' }
      : gates.fakeScore && typeof fakeScore === 'number' && fakeScore >= 40
        ? { label: 'Unusual', className: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200' }
        : null

  return (
    <>
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-50">AI Reply Studio</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tune language &amp; tone, then edit before publish.</p>
            </div>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          {detailLoading ? (
            <p className="mb-3 text-xs text-slate-500">Loading review context…</p>
          ) : detail ? (
            <div className="mb-4 rounded-xl border border-slate-200/90 bg-slate-50/80 p-3 text-sm dark:border-slate-700 dark:bg-slate-950/40">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{detail.reviewerName}</span>
                <span className="text-xs text-slate-500">{detail.rating}/5</span>
                {trustBadge ? (
                  <span
                    title={
                      fakeSignals.length
                        ? `${fakeSignals.join(' · ')}\n\nThis is an AI estimate. Always use your own judgment before reporting.`
                        : 'This is an AI estimate. Always use your own judgment before reporting.'
                    }
                    className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', trustBadge.className)}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {trustBadge.label}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-slate-700 dark:text-slate-300">{detail.comment || 'No text review'}</p>
              {trustBadge ? (
                <a
                  className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  href="https://support.google.com/business/answer/4596773"
                  target="_blank"
                  rel="noreferrer"
                >
                  Report to Google
                </a>
              ) : null}
            </div>
          ) : null}

          {gates.autopsy && detail && detail.rating <= 2 ? (
            <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left text-sm font-semibold text-amber-950 dark:text-amber-100"
                onClick={() => setAutopsyOpen((v) => !v)}
              >
                <span>Why this probably happened</span>
                {autopsyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {autopsyOpen ? (
                detail.autopsy ? (
                  <div className="mt-2 space-y-2 text-sm">
                    <p className="text-amber-900 dark:text-amber-200">
                      <span className="font-semibold">Root cause: </span>
                      {detail.autopsy.rootCause}
                    </p>
                    <p className="text-emerald-800 dark:text-emerald-200">
                      <span className="font-semibold">Suggested fix: </span>
                      {detail.autopsy.suggestedFix}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">Based on your last 90 days of reviews</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-amber-900/90 dark:text-amber-200/90">
                    Autopsy runs in the background after sync when you have 10+ reviews. Check back shortly.
                  </p>
                )
              ) : null}
            </div>
          ) : null}

          {detail && detail.rating >= 4 ? (
            <div className="mb-4">
              <Button variant="outline" className="rounded-xl border-indigo-200" onClick={() => setSocialOpen(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Create social content
              </Button>
            </div>
          ) : null}

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Language</p>
              <div className="flex flex-wrap gap-1.5">
                {languages.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLanguage(l.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      language === l.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tone</p>
              <div className="flex flex-wrap gap-1.5">
                {tones.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      tone === t.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Generated reply appears here — edit freely before publishing."
              rows={6}
              className={cn(
                'w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 dark:border-slate-600 dark:bg-slate-950/50 dark:text-slate-100'
              )}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={generate} disabled={loading} className="rounded-xl">
                {loading ? 'Generating…' : 'Generate draft'}
              </Button>
              <Button onClick={publish} variant="secondary" disabled={loading || reply.length < 20} className="rounded-xl">
                Publish to Google
              </Button>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Tip: For sensitive 1★ reviews, switch to Formal or Concise, then add your direct contact line before publishing.
            </p>
          </div>
        </div>
      </div>

      <SocialPostModal
        open={socialOpen}
        reviewId={reviewId}
        businessName={locationName || 'Your business'}
        rating={detail?.rating || 5}
        reviewerName={detail?.reviewerName || 'Customer'}
        comment={detail?.comment}
        onClose={() => setSocialOpen(false)}
      />
    </>
  )
}
