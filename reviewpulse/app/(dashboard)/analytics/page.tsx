import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Review from '@/models/Review'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

export default async function AnalyticsPage() {
  await connectDB()
  const session = await auth()

  const reviews = session?.user?.id
    ? await Review.find({ userId: session.user.id }).sort({ reviewCreatedAt: -1 }).lean()
    : []

  const sentimentCounts = reviews.reduce(
    (acc, review) => {
      acc[review.sentiment] += 1
      return acc
    },
    { positive: 0, neutral: 0, negative: 0 }
  )

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Sentiment Analytics</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardTitle className="text-[#16A34A]">{sentimentCounts.positive}</CardTitle>
          <CardDescription>Positive Reviews</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-[#CA8A04]">{sentimentCounts.neutral}</CardTitle>
          <CardDescription>Neutral Reviews</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-[#DC2626]">{sentimentCounts.negative}</CardTitle>
          <CardDescription>Negative Reviews</CardDescription>
        </Card>
      </div>
    </div>
  )
}
