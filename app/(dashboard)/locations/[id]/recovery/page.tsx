'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, MessageSquare, RefreshCw, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type RecoveryReview = {
  id: string
  reviewerName: string
  rating: number
  comment: string
  status: 'pending' | 'replied' | 'ignored'
  sentiment: string
  reviewCreatedAt: string
  publishedReply?: string
  locationId: string
}

type RecoveryData = {
  location: { name: string; locationSlug: string }
  needsReply: RecoveryReview[]
  monitoring: RecoveryReview[]
  totalNegative: number
  replied: number
  recoveryRate: number
}

function daysSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400_000)
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function RatingDots({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`inline-block h-2.5 w-2.5 rounded-full ${i < rating ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-600'}`} />
      ))}
      <span className="ml-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">{rating}★</span>
    </span>
  )
}

function ReviewRow({ review, showReply }: { review: RecoveryReview; showReply?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-900/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{review.reviewerName}</span>
            <RatingDots rating={review.rating} />
            <span className="text-[11px] text-slate-400 dark:text-slate-500">{daysSince(review.reviewCreatedAt)}</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{review.comment || 'No text'}</p>
          {showReply && review.publishedReply && (
            <div className="mt-2 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300">
              <span className="font-semibold">Your reply: </span>{review.publishedReply.slice(0, 120)}{review.publishedReply.length > 120 ? '…' : ''}
            </div>
          )}
        </div>
        <Link
          href={`/reviews?highlight=${review.id}`}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {review.status === 'pending' ? 'Reply →' : 'View →'}
        </Link>
      </div>
    </div>
  )
}

export default function RecoveryPage() {
  const params = useParams()
  const id = String(params.id)
  const [data, setData] = useState<RecoveryData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/locations/${id}/recovery`)
      const json = await res.json()
      if (json?.data) setData(json.data as RecoveryData)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [id])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/locations/${id}`} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            1-Star Recovery Tracker
          </h1>
          {data?.location?.name && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{data.location.name}</p>
          )}
        </div>
        <Button size="sm" variant="outline" className="ml-auto rounded-xl gap-1.5" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : !data ? (
        <Card className="px-6 py-12 text-center">
          <p className="text-sm text-slate-500">Unable to load recovery data. Try again.</p>
        </Card>
      ) : (
        <>
          {/* Metric Row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                label: 'Recovery Rate',
                value: `${data.recoveryRate}%`,
                icon: TrendingUp,
                color: data.recoveryRate >= 60 ? 'text-emerald-600' : data.recoveryRate >= 30 ? 'text-amber-600' : 'text-rose-600',
                bg: data.recoveryRate >= 60 ? 'bg-emerald-50 dark:bg-emerald-950/30' : data.recoveryRate >= 30 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-rose-50 dark:bg-rose-950/30',
                sub: 'of negative reviews replied',
              },
              {
                label: 'Need Reply',
                value: data.needsReply.length,
                icon: AlertTriangle,
                color: data.needsReply.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400',
                bg: 'bg-rose-50 dark:bg-rose-950/30',
                sub: '1–2★ without a response',
              },
              {
                label: 'Monitoring',
                value: data.monitoring.length,
                icon: Clock,
                color: 'text-amber-600 dark:text-amber-400',
                bg: 'bg-amber-50 dark:bg-amber-950/30',
                sub: 'replied — watching',
              },
              {
                label: 'Total Negative',
                value: data.totalNegative,
                icon: MessageSquare,
                color: 'text-slate-600 dark:text-slate-400',
                bg: 'bg-slate-50 dark:bg-slate-800/40',
                sub: '1–2★ reviews ever',
              },
            ].map(({ label, value, icon: Icon, color, bg, sub }) => (
              <div key={label} className={`rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/60 ${bg}`}>
                <div className={`mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${color}`}>
                  <Icon className="h-3 w-3" />
                  {label}
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Recovery Checklist */}
          <Card className="p-5 dark:border-slate-700 dark:bg-slate-900/60">
            <CardTitle className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
              Recovery Playbook
            </CardTitle>
            <div className="space-y-2">
              {[
                { step: '1', text: 'Reply within 1 hour — Google surfaces fast responders in local search', done: data.recoveryRate > 0 },
                { step: '2', text: 'Empathise first, explain second — never argue in a public reply', done: false },
                { step: '3', text: 'Offer to resolve offline ("Please call us at…")', done: false },
                { step: '4', text: 'Follow up after 7 days — happy customers often update their rating', done: false },
                { step: '5', text: 'Report fake / spam reviews using the ⋮ menu on Google Maps', done: false },
              ].map(({ step, text, done }) => (
                <div key={step} className="flex items-start gap-3 text-sm">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${done ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {done ? <CheckCircle2 className="h-3 w-3" /> : step}
                  </span>
                  <span className={done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}>{text}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Needs Reply */}
          {data.needsReply.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Needs Reply ({data.needsReply.length})
                </h2>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                  Urgent
                </span>
              </div>
              <div className="space-y-3">
                {data.needsReply.map((r) => <ReviewRow key={r.id} review={r} />)}
              </div>
            </section>
          )}

          {/* Monitoring (replied, watching) */}
          {data.monitoring.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Monitoring — Awaiting Update ({data.monitoring.length})
                </h2>
              </div>
              <div className="space-y-3">
                {data.monitoring.map((r) => <ReviewRow key={r.id} review={r} showReply />)}
              </div>
            </section>
          )}

          {data.needsReply.length === 0 && data.monitoring.length === 0 && (
            <Card className="px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/50">
              <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
              <p className="font-semibold text-slate-800 dark:text-slate-200">All clear!</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No unaddressed 1–2★ reviews.</p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
