'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

  return (
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
  )
}
