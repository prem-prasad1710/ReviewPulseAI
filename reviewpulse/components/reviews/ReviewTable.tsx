import { Table, TD, TH } from '@/components/ui/table'
import SentimentBadge from '@/components/reviews/SentimentBadge'
import { Button } from '@/components/ui/button'

interface ReviewRow {
  _id: string
  reviewerName: string
  rating: number
  comment?: string
  sentiment: 'positive' | 'neutral' | 'negative'
  status: 'pending' | 'replied' | 'ignored'
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
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        No reviews yet. Connect your Google Business Profile to start.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <Table>
        <thead>
          <tr>
            <TH>Reviewer</TH>
            <TH>Rating</TH>
            <TH>Review</TH>
            <TH>Sentiment</TH>
            <TH>Status</TH>
            <TH>Action</TH>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review._id}>
              <TD>{review.reviewerName}</TD>
              <TD>{review.rating}/5</TD>
              <TD className="max-w-[280px] truncate">{review.comment || 'No text review'}</TD>
              <TD>
                <SentimentBadge sentiment={review.sentiment} />
              </TD>
              <TD>{review.status}</TD>
              <TD>
                <Button size="sm" onClick={() => onGenerate(review._id)}>
                  Generate Reply
                </Button>
              </TD>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
