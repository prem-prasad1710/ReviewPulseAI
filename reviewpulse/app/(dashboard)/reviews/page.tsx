'use client'

import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import ReviewTable from '@/components/reviews/ReviewTable'
import ReplyModal from '@/components/reviews/ReplyModal'
import { Skeleton } from '@/components/ui/skeleton'

interface ReviewItem {
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

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/reviews', { cache: 'no-store' })
      const json = await response.json()
      setReviews(json?.data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24 rounded-md" />
          <Skeleton className="h-9 w-2/3 max-w-md rounded-lg" />
          <Skeleton className="h-4 w-full max-w-lg rounded-md" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Inbox</p>
          <h2 className="font-heading mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
            <MessageSquare className="h-7 w-7 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden />
            All reviews
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Filter by sentiment in the table, generate tone-aware AI drafts, then publish when the wording feels right.
          </p>
        </div>
      </div>

      <ReviewTable reviews={reviews} onGenerate={setSelectedReviewId} />

      <ReplyModal
        reviewId={selectedReviewId}
        open={!!selectedReviewId}
        onClose={() => setSelectedReviewId(null)}
      />
    </div>
  )
}
