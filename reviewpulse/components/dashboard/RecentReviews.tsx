import Link from 'next/link'
import { ArrowUpRight, Star } from 'lucide-react'
import SentimentBadge from '@/components/reviews/SentimentBadge'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-400" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i < Math.round(rating) ? 'fill-current' : 'fill-none text-slate-200 dark:text-slate-600'
          )}
        />
      ))}
    </div>
  )
}

export default function RecentReviews({
  reviews,
}: {
  reviews: { reviewerName: string; rating: number; comment?: string; sentiment: 'positive' | 'neutral' | 'negative' }[]
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-2xl border-slate-200/80 shadow-sm dark:border-slate-700/80 dark:shadow-black/15">
      <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 dark:border-slate-700/80 dark:bg-slate-800/40">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="font-heading text-lg">Recent reviews</CardTitle>
            <CardDescription className="mt-1">Latest from your Business Profile</CardDescription>
          </div>
          <Link
            href="/reviews"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
          >
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {reviews.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-12 text-center dark:border-slate-600 dark:bg-slate-800/30">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No reviews synced yet</p>
            <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">Connect Google Business Profile to pull your latest feedback here.</p>
          </div>
        ) : (
          reviews.map((item, idx) => (
            <div
              key={`${item.reviewerName}-${idx}`}
              className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-slate-200 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900/70 dark:hover:border-slate-600 dark:hover:shadow-black/20"
            >
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-sm font-bold text-slate-600 dark:from-slate-700 dark:to-slate-600 dark:text-slate-200">
                    {item.reviewerName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{item.reviewerName}</p>
                    <RatingStars rating={item.rating} />
                  </div>
                </div>
                <SentimentBadge sentiment={item.sentiment} />
              </div>
              <p className="line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.comment || 'No written comment'}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
