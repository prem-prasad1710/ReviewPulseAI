import type { Types } from 'mongoose'

export interface FakeScoreReviewSlice {
  _id: Types.ObjectId | string
  comment?: string
  rating: number
  reviewerName: string
  reviewCreatedAt: Date
}

export function computeFakeScore(
  review: Pick<FakeScoreReviewSlice, 'comment' | 'rating' | 'reviewerName' | 'reviewCreatedAt' | '_id'>,
  recentReviews: Pick<FakeScoreReviewSlice, 'reviewCreatedAt' | '_id'>[]
): { score: number; signals: string[] } {
  let score = 0
  const signals: string[] = []

  if (!review.comment || review.comment.length < 15) {
    score += 20
    signals.push('Very short review — no specific details')
  }

  if (review.rating === 1 && review.comment && review.comment.length < 30) {
    score += 15
    signals.push('1-star with minimal explanation')
  }

  const windowEnd = new Date(review.reviewCreatedAt)
  const windowStart = new Date(windowEnd.getTime() - 60 * 60 * 1000)
  const clusterCount = recentReviews.filter(
    (r) =>
      String(r._id) !== String(review._id) &&
      new Date(r.reviewCreatedAt) >= windowStart &&
      new Date(r.reviewCreatedAt) <= windowEnd
  ).length
  if (clusterCount >= 2) {
    score += 30
    signals.push(`Part of a review cluster — ${clusterCount + 1} reviews in 1 hour`)
  }

  if (/^(user|customer|guest|a google user|\d+)/i.test(review.reviewerName)) {
    score += 15
    signals.push('Generic or anonymous reviewer name')
  }

  return { score: Math.min(score, 100), signals }
}
