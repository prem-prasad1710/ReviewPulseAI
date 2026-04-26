import { Star } from 'lucide-react'
import SentimentBadge from '@/components/reviews/SentimentBadge'
import { Card } from '@/components/ui/card'

interface ReviewCardProps {
  reviewerName: string
  rating: number
  comment?: string
  sentiment: 'positive' | 'neutral' | 'negative'
  status: 'pending' | 'replied' | 'ignored'
}

export default function ReviewCard({ reviewerName, rating, comment, sentiment, status }: ReviewCardProps) {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{reviewerName}</h3>
        <SentimentBadge sentiment={sentiment} />
      </div>

      <div className="mb-2 flex items-center gap-1 text-amber-500">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className={`h-4 w-4 ${index < rating ? 'fill-current' : ''}`} />
        ))}
      </div>

      <p className="mb-3 text-sm text-slate-700">{comment || 'No text review'}</p>
      <p className="text-xs text-slate-500">Status: {status}</p>
    </Card>
  )
}
