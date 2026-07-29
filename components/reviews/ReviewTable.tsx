'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import { AlertTriangle, Share2 } from 'lucide-react'
import { Table, TD, TH } from '@/components/ui/table'
import SentimentBadge from '@/components/reviews/SentimentBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LANGUAGE_FLAG_LABEL } from '@/lib/language-detect'
import { cn } from '@/lib/utils'
import ShareCardModal from '@/components/reviews/ShareCardModal'

interface ReviewRow {
  _id: string
  reviewerName: string
  rating: number
  comment?: string
  sentiment: 'positive' | 'neutral' | 'negative'
  status: 'pending' | 'replied' | 'ignored' | 'scheduled'
  detectedLanguage?: string
  translatedText?: string
  fakeScore?: number
  fakeSignals?: string[]
}

function TrustBadge({ review }: { review: ReviewRow }) {
  const score = review.fakeScore
  if (typeof score !== 'number' || score < 40) return <span className="text-xs text-slate-400">—</span>
  const high = score >= 70
  const label = high ? 'Suspicious' : 'Unusual'
  const title = (review.fakeSignals?.length ? review.fakeSignals.join(' · ') + '\n\n' : '') +
    'This is an AI estimate. Always use your own judgment before reporting.'
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        high
          ? 'bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-200'
          : 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
      }`}
    >
      <AlertTriangle className="h-3 w-3" />
      {label}
    </span>
  )
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

function ReviewTextCell({ review, compact }: { review: ReviewRow; compact?: boolean }) {
  const [showTranslation, setShowTranslation] = useState(false)
  const flag = review.detectedLanguage
    ? LANGUAGE_FLAG_LABEL[review.detectedLanguage] || `🌐 ${review.detectedLanguage}`
    : null
  const hasTranslation = Boolean(review.translatedText && review.detectedLanguage && review.detectedLanguage !== 'en')

  return (
    <div className={cn('text-slate-700 dark:text-slate-300', compact ? 'w-full' : 'max-w-[min(320px,44vw)]')}>
      <div className="flex flex-wrap items-center gap-1.5">
        {flag ? <span className="text-xs" title={review.detectedLanguage}>{flag}</span> : null}
        <span className={compact ? 'text-sm leading-relaxed' : 'line-clamp-2'} title={review.comment || undefined}>
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

function ReviewActions({
  review,
  onGenerate,
  onShare,
  fullWidth,
}: {
  review: ReviewRow
  onGenerate: (reviewId: string) => void
  onShare: (review: ReviewRow) => void
  fullWidth?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2', fullWidth ? 'w-full' : 'justify-end')}>
      {review.rating >= 4 ? (
        <button
          type="button"
          title="Generate social share card"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-violet-600 transition-colors hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/40"
          onClick={() => onShare(review)}
        >
          <Share2 className="h-4 w-4" />
        </button>
      ) : null}
      <Button
        size="sm"
        variant={review.status === 'replied' ? 'outline' : 'default'}
        className={cn('rounded-xl shadow-sm dark:shadow-none', fullWidth && 'min-h-10 flex-1')}
        onClick={() => onGenerate(review._id)}
      >
        {review.status === 'replied' ? 'New draft' : 'Generate reply'}
      </Button>
    </div>
  )
}

function MobileReviewCard({
  review,
  highlighted,
  onGenerate,
  onShare,
}: {
  review: ReviewRow
  highlighted: boolean
  onGenerate: (reviewId: string) => void
  onShare: (review: ReviewRow) => void
}) {
  return (
    <article
      id={`review-row-${review._id}`}
      className={cn(
        'rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/50',
        highlighted && 'ring-2 ring-indigo-500/55 bg-indigo-50/40 dark:bg-indigo-950/20'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{review.reviewerName}</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{review.rating}/5 stars</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          <SentimentBadge sentiment={review.sentiment} />
          <StatusBadge status={review.status} />
        </div>
      </div>
      <ReviewTextCell review={review} compact />
      <div className="mt-2">
        <TrustBadge review={review} />
      </div>
      <div className="mt-4">
        <ReviewActions review={review} onGenerate={onGenerate} onShare={onShare} fullWidth />
      </div>
    </article>
  )
}

export default function ReviewTable({
  reviews,
  highlightReviewId,
  onGenerate,
}: {
  reviews: ReviewRow[]
  highlightReviewId?: string | null
  onGenerate: (reviewId: string) => void
}) {
  const [shareReview, setShareReview] = useState<ReviewRow | null>(null)

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
    <>
      {/* Mobile: card stack */}
      <div className="space-y-3 md:hidden">
        {reviews.map((review) => (
          <MobileReviewCard
            key={review._id}
            review={review}
            highlighted={highlightReviewId === review._id}
            onGenerate={onGenerate}
            onShare={setShareReview}
          />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_30px_-18px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.03] dark:border-slate-700/80 dark:bg-slate-900/50 dark:shadow-black/25 dark:ring-white/[0.04] md:block">
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr className="border-b border-slate-200/90 bg-gradient-to-r from-slate-50 via-white to-indigo-50/50 dark:border-slate-700/80 dark:from-slate-800/80 dark:via-slate-900/90 dark:to-slate-900">
                <TH>Reviewer</TH>
                <TH>Rating</TH>
                <TH>Review</TH>
                <TH>Sentiment</TH>
                <TH className="hidden lg:table-cell">Trust</TH>
                <TH>Status</TH>
                <TH className="text-right">Action</TH>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => {
                const highlighted = highlightReviewId === review._id
                const rowStyle: CSSProperties | undefined = highlighted
                  ? { boxShadow: 'inset 0 0 0 2px rgba(37, 99, 235, 0.55)' }
                  : undefined
                return (
                  <tr
                    key={review._id}
                    id={`review-row-${review._id}`}
                    style={rowStyle}
                    className={`transition-colors hover:bg-slate-50/90 dark:hover:bg-slate-800/40 ${
                      highlighted ? 'bg-indigo-50/50 dark:bg-indigo-950/25' : ''
                    }`}
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
                    <TD className="hidden lg:table-cell">
                      <TrustBadge review={review} />
                    </TD>
                    <TD>
                      <StatusBadge status={review.status} />
                    </TD>
                    <TD className="text-right">
                      <ReviewActions review={review} onGenerate={onGenerate} onShare={setShareReview} />
                    </TD>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div>
      </div>

      {shareReview ? (
        <ShareCardModal
          reviewId={shareReview._id}
          reviewerName={shareReview.reviewerName}
          rating={shareReview.rating}
          comment={shareReview.comment}
          onClose={() => setShareReview(null)}
        />
      ) : null}
    </>
  )
}
