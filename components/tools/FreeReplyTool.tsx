'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function FreeReplyTool() {
  const [reviewText, setReviewText] = useState('')
  const [rating, setRating] = useState(2)
  const [businessName, setBusinessName] = useState('')
  const [language, setLanguage] = useState<'english' | 'hindi' | 'hinglish'>('english')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setLoading(true)
    setError(null)
    setReply('')
    try {
      const res = await fetch('/api/public/free-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText: reviewText.trim(),
          rating,
          businessName: businessName.trim() || undefined,
          language,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(j?.error || 'Could not generate')
        return
      }
      setReply(String(j?.data?.reply || ''))
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900/80">
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Paste the review</label>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={5}
          placeholder="Example: Food was cold and staff ignored us for 20 minutes…"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Star rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n === 1 ? '' : 's'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as typeof language)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
            >
              <option value="english">English</option>
              <option value="hinglish">Hinglish</option>
              <option value="hindi">Hindi</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Business name (optional)</label>
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Namma Biryani Indiranagar"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
          />
        </div>
        {error ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
        <Button className="mt-5 w-full rounded-xl sm:w-auto" disabled={loading || reviewText.trim().length < 10} onClick={() => void run()}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Drafting…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Get professional reply
            </>
          )}
        </Button>
      </div>

      {reply ? (
        <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-white p-6 dark:border-indigo-500/30 dark:from-indigo-950/50 dark:to-slate-900/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Suggested reply</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-900 dark:text-slate-100">{reply}</p>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Copy, edit, and post on Google. For one-click publish from your phone,{' '}
            <Link href="/login" className="font-semibold text-indigo-600 underline dark:text-indigo-400">
              create a free account
            </Link>
            .
          </p>
        </div>
      ) : null}
    </div>
  )
}
