import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { formatCurrencyINR } from '@/lib/utils'

export default function StatsCards({
  totalReviews,
  averageRating,
  pendingReplies,
  repliedThisMonth,
}: {
  totalReviews: number
  averageRating: number
  pendingReplies: number
  repliedThisMonth: number
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardDescription>Total Reviews</CardDescription>
        <CardTitle className="mt-2 text-2xl">{totalReviews}</CardTitle>
      </Card>
      <Card>
        <CardDescription>Average Rating</CardDescription>
        <CardTitle className="mt-2 text-2xl">{averageRating.toFixed(1)} / 5</CardTitle>
      </Card>
      <Card>
        <CardDescription>Pending Replies</CardDescription>
        <CardTitle className="mt-2 text-2xl">{pendingReplies}</CardTitle>
      </Card>
      <Card>
        <CardDescription>Revenue Potential</CardDescription>
        <CardTitle className="mt-2 text-2xl">{formatCurrencyINR(repliedThisMonth * 999)}</CardTitle>
      </Card>
    </div>
  )
}
