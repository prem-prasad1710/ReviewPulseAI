'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
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

export default function ReviewsInbox() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)
  const [highlightReviewId, setHighlightReviewId] = useState<string | null>(null)

  const locationId = searchParams.get('locationId')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const q = locationId ? `?locationId=${encodeURIComponent(locationId)}` : ''
      const response = await fetch(`/api/reviews${q}`, { cache: 'no-store' })
      const json = await response.json()
      setReviews(json?.data || [])
      setLoading(false)
    }
    void load()
  }, [locationId])

  useEffect(() => {
    queueMicrotask(() => {
      const reviewId = searchParams.get('review')
      const openReply = searchParams.get('openReply') === '1'
      if (!reviewId || reviews.length === 0) return
      const exists = reviews.some((r) => r._id === reviewId)
      if (!exists) return

      setHighlightReviewId(reviewId)
      queueMicrotask(() => {
        document.getElementById(`review-row-${reviewId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
      if (openReply) {
        setSelectedReviewId(reviewId)
        toast.message('Opened AI reply for this review', { description: 'From your alert link' })
      }
      const loc = searchParams.get('locationId')
      const next = loc ? `/reviews?locationId=${encodeURIComponent(loc)}` : '/reviews'
      router.replace(next, { scroll: false })
    })
  }, [searchParams, reviews, router])

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
            {locationId
              ? 'Showing reviews for this location only (from Locations). Generate drafts and publish when ready.'
              : 'Filter by sentiment in the table, generate tone-aware AI drafts, then publish when the wording feels right.'}
          </p>
        </div>
      </div>

      <ReviewTable
        reviews={reviews}
        highlightReviewId={highlightReviewId}
        onGenerate={setSelectedReviewId}
      />

      <ReplyModal
        reviewId={selectedReviewId}
        open={!!selectedReviewId}
        onClose={() => setSelectedReviewId(null)}
      />
    </div>
  )
}
