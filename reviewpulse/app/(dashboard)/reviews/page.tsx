'use client'

import { useEffect, useState } from 'react'
import ReviewTable from '@/components/reviews/ReviewTable'
import ReplyModal from '@/components/reviews/ReplyModal'
import { Skeleton } from '@/components/ui/skeleton'

interface ReviewItem {
  _id: string
  reviewerName: string
  rating: number
  comment?: string
  sentiment: 'positive' | 'neutral' | 'negative'
  status: 'pending' | 'replied' | 'ignored'
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
      <div className="space-y-3">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">All Reviews</h2>
        <p className="text-sm text-slate-600">Generate and publish replies in one click.</p>
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
