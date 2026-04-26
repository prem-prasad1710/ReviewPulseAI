'use client'

import { useState } from 'react'
import { Table, TD, TH } from '@/components/ui/table'
import SentimentBadge from '@/components/reviews/SentimentBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LANGUAGE_FLAG_LABEL } from '@/lib/language-detect'
import { cn } from '@/lib/utils'

interface ReviewRow {
  _id: string
  reviewerName: string
  rating: number
  comment?: string
  sentiment: 'positive' | 'neutral' | 'negative'
  status: 'pending' | 'replied' | 'ignored' | 'scheduled'
  detectedLanguage?: string
  translatedText?: string
}

function StatusBadge({ status }: { status: ReviewRow['status'] }) {
  const styles: Record<ReviewRow['status'], string> = {
    pending:
      'border border-amber-200/90 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/45 dark:text-amber-200',
    scheduled:
      'border border-sky-200/90 bg-sky-50 text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/45 dark:text-sky-200',
    replied:
      'border border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/45 dark:text-emerald-200',
    ignored:
      'border border-slate-200/90 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
  }
  const label = status === 'scheduled' ? 'scheduled' : status
  return (
    <Badge className={cn('font-medium capitalize', styles[status])}>
      {label}
    </Badge>
  )
}

function ReviewTextCell({ review }: { review: ReviewRow }) {
  const [showTranslation, setShowTranslation] = useState(false)
  const flag = review.detectedLanguage
    ? LANGUAGE_FLAG_LABEL[review.detectedLanguage] || `🌐 ${review.detectedLanguage}`
    : null
  const hasTranslation = Boolean(review.translatedText && review.detectedLanguage && review.detectedLanguage !== 'en')

  return (
    <div className="max-w-[min(320px,44vw)] text-slate-700 dark:text-slate-300">
      <div className="flex flex-wrap items-center gap-1.5">
        {flag ? <span className="text-xs" title={review.detectedLanguage}>{flag}</span> : null}
        <span className="line-clamp-2" title={review.comment || undefined}>
          {review.comment || 'No text review'}
        </span>
      </div>
      {hasTranslation ? (
        <div className="mt-1">
          <button
            type="button"
            className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            onClick={() => setShowTranslation((v) => !v)}
          >
            {showTranslation ? 'Hide translation' : 'Show translation'}
          </button>
          {showTranslation ? (
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{review.translatedText}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default function ReviewTable({
  reviews,
  onGenerate,
}: {
  reviews: ReviewRow[]
  onGenerate: (reviewId: string) => void
}) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300/90 bg-gradient-to-b from-slate-50/90 to-white px-6 py-14 text-center dark:border-slate-600 dark:from-slate-900/50 dark:to-slate-900/30">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No reviews in your inbox yet</p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Connect Google Business Profile and run a sync—reviews will land here with sentiment and reply status.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_30px_-18px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.03] dark:border-slate-700/80 dark:bg-slate-900/50 dark:shadow-black/25 dark:ring-white/[0.04]">
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr className="border-b border-slate-200/90 bg-gradient-to-r from-slate-50 via-white to-indigo-50/50 dark:border-slate-700/80 dark:from-slate-800/80 dark:via-slate-900/90 dark:to-slate-900">
              <TH>Reviewer</TH>
              <TH>Rating</TH>
              <TH>Review</TH>
              <TH>Sentiment</TH>
              <TH>Status</TH>
              <TH className="text-right">Action</TH>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr
                key={review._id}
                className="transition-colors hover:bg-slate-50/90 dark:hover:bg-slate-800/40"
              >
                <TD className="font-medium text-slate-900 dark:text-slate-100">{review.reviewerName}</TD>
                <TD>
                  <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-800 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600/80">
                    {review.rating}/5
                  </span>
                </TD>
                <TD>
                  <ReviewTextCell review={review} />
                </TD>
                <TD>
                  <SentimentBadge sentiment={review.sentiment} />
                </TD>
                <TD>
                  <StatusBadge status={review.status} />
                </TD>
                <TD className="text-right">
                  <Button
                    size="sm"
                    variant={review.status === 'replied' ? 'outline' : 'default'}
                    className="rounded-xl shadow-sm dark:shadow-none"
                    onClick={() => onGenerate(review._id)}
                  >
                    {review.status === 'replied' ? 'New draft' : 'Generate reply'}
                  </Button>
                </TD>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  )
}
