'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import type { CustomerThemesStatus } from '@/lib/customer-themes'

type ThemeItem = {
  topic: string
  emoji: string
  count: number
  sentiment: 'positive' | 'negative'
}

type ThemesData = {
  loves: ThemeItem[]
  complaints: ThemeItem[]
  topMentions: string[]
  summary: string
  reviewCount: number
  generatedAt: string
}

type EmptyState = {
  status: CustomerThemesStatus
  message: string
  recentReviewCount?: number
}

const EMPTY_ACTIONS: Partial<Record<CustomerThemesStatus, { href: string; label: string }>> = {
  no_reviews: { href: '/locations/connect', label: 'Connect Google' },
  no_recent_reviews: { href: '/reviews', label: 'View all reviews' },
  insufficient_reviews: { href: '/reviews', label: 'View reviews' },
}

function emptyTitle(status: CustomerThemesStatus): string {
  switch (status) {
    case 'no_reviews':
      return 'No reviews yet'
    case 'no_recent_reviews':
      return 'Nothing in the last 30 days'
    case 'insufficient_reviews':
      return 'Almost there'
    case 'no_review_text':
      return 'Need written feedback'
    case 'analysis_unavailable':
      return 'Themes temporarily unavailable'
    default:
      return 'Insights not ready'
  }
}

export default function CustomerThemesCard({ locationId }: { locationId?: string }) {
  const [data, setData] = useState<ThemesData | null>(null)
  const [empty, setEmpty] = useState<EmptyState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setEmpty(null)
    try {
      const qs = locationId ? `?locationId=${encodeURIComponent(locationId)}` : ''
      const res = await fetch(`/api/insights/customer-themes${qs}`)
      const json = (await res.json()) as {
        success?: boolean
        error?: string
        data?: {
          themes?: ThemesData | null
          status?: CustomerThemesStatus
          message?: string | null
          recentReviewCount?: number
        }
      }

      if (!res.ok || json.success === false) {
        setData(null)
        setError(json.error || 'Could not load insights. Try refreshing.')
        return
      }

      const payload = json.data
      if (payload?.status === 'ready' && payload.themes) {
        setData(payload.themes)
        setEmpty(null)
        return
      }

      if (payload?.message && payload.status && payload.status !== 'ready') {
        setData(null)
        setEmpty({
          status: payload.status,
          message: payload.message,
          recentReviewCount: payload.recentReviewCount,
        })
        return
      }

      setData(null)
      setEmpty({
        status: 'insufficient_reviews',
        message: 'Sync at least 3 reviews from the last 30 days to unlock AI theme analysis.',
      })
    } catch {
      setData(null)
      setError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [locationId])

  useEffect(() => {
    void load()
  }, [load])

  const emptyAction = empty ? EMPTY_ACTIONS[empty.status] : undefined

  return (
    <Card className="space-y-5 p-6 dark:border-slate-700 dark:bg-slate-900/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-violet-500" />
            What Customers Are Really Saying
          </CardTitle>
          <CardDescription className="mt-0.5">
            AI-extracted themes from the last 30 days of reviews
          </CardDescription>
        </div>
        <button
          type="button"
          className="h-8 rounded-lg px-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Refresh themes"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analysing customer voice…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-5 text-center dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
          <button
            type="button"
            className="mt-3 text-xs font-semibold text-red-700 underline-offset-2 hover:underline dark:text-red-300"
            onClick={() => void load()}
          >
            Try again
          </button>
        </div>
      ) : empty ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center dark:border-slate-600 dark:bg-slate-800/40">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{emptyTitle(empty.status)}</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {empty.message}
          </p>
          {emptyAction ? (
            <Link
              href={emptyAction.href}
              className="mt-4 inline-flex text-xs font-semibold text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
            >
              {emptyAction.label} →
            </Link>
          ) : null}
        </div>
      ) : data ? (
        <>
          {data.summary ? (
            <p className="rounded-xl border border-violet-100 bg-violet-50/80 px-4 py-2.5 text-sm font-medium text-violet-900 dark:border-violet-800/50 dark:bg-violet-950/30 dark:text-violet-200">
              &ldquo;{data.summary}&rdquo;
            </p>
          ) : null}

          {data.loves.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                ❤️ What They Love
              </p>
              <div className="flex flex-wrap gap-2">
                {data.loves.map((item) => (
                  <span
                    key={item.topic}
                    title={`Mentioned ~${item.count} times`}
                    className="flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                  >
                    <span>{item.emoji}</span>
                    <span>{item.topic}</span>
                    <span className="ml-0.5 rounded-full bg-emerald-200/80 px-1.5 py-0.5 text-[10px] dark:bg-emerald-800/50">
                      ×{item.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {data.complaints.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-400">
                🔧 Needs Improvement
              </p>
              <div className="flex flex-wrap gap-2">
                {data.complaints.map((item) => (
                  <span
                    key={item.topic}
                    title={`Mentioned ~${item.count} times`}
                    className="flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-300"
                  >
                    <span>{item.emoji}</span>
                    <span>{item.topic}</span>
                    <span className="ml-0.5 rounded-full bg-rose-200/80 px-1.5 py-0.5 text-[10px] dark:bg-rose-800/50">
                      ×{item.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {data.topMentions.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                💬 Most Mentioned
              </p>
              <div className="flex flex-wrap gap-2">
                {data.topMentions.map((mention) => (
                  <span
                    key={mention}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {mention}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Based on {data.reviewCount} reviews · Regenerate anytime
          </p>
        </>
      ) : null}
    </Card>
  )
}
