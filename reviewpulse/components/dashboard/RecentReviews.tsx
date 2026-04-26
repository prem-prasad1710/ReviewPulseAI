import SentimentBadge from '@/components/reviews/SentimentBadge'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

export default function RecentReviews({
  reviews,
}: {
  reviews: { reviewerName: string; rating: number; comment?: string; sentiment: 'positive' | 'neutral' | 'negative' }[]
}) {
  return (
    <Card>
      <CardTitle>Recent Reviews</CardTitle>
      <CardDescription className="mb-4">Latest feedback from your Google profile</CardDescription>
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500">No reviews yet. Connect your Google Business Profile to start.</p>
        ) : (
          reviews.map((item, idx) => (
            <div key={`${item.reviewerName}-${idx}`} className="rounded-md border border-slate-100 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-medium text-slate-900">{item.reviewerName}</p>
                <SentimentBadge sentiment={item.sentiment} />
              </div>
              <p className="mb-1 text-sm text-slate-500">Rating: {item.rating}/5</p>
              <p className="text-sm text-slate-700">{item.comment || 'No comment provided'}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
