import { connectDB } from '@/lib/mongodb'
import { auth } from '@/lib/auth'
import Review from '@/models/Review'
import StatsCards from '@/components/dashboard/StatsCards'
import SentimentChart from '@/components/dashboard/SentimentChart'
import RecentReviews from '@/components/dashboard/RecentReviews'

export default async function DashboardPage() {
  await connectDB()
  const session = await auth()
  const userId = session?.user?.id

  const reviews = userId
    ? await Review.find({ userId }).sort({ reviewCreatedAt: -1 }).limit(50).lean()
    : []

  const totalReviews = reviews.length
  const pendingReplies = reviews.filter((r) => r.status === 'pending').length
  const repliedThisMonth = reviews.filter((r) => r.status === 'replied').length
  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length : 0

  const trendMap = new Map<string, { total: number; count: number }>()
  reviews.forEach((r) => {
    const day = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(
      new Date(r.reviewCreatedAt)
    )
    const prev = trendMap.get(day) || { total: 0, count: 0 }
    trendMap.set(day, { total: prev.total + r.rating, count: prev.count + 1 })
  })

  const trendData = Array.from(trendMap.entries())
    .slice(-7)
    .map(([day, values]) => ({ day, avgRating: Number((values.total / values.count).toFixed(2)) }))

  return (
    <div className="space-y-5">
      <StatsCards
        totalReviews={totalReviews}
        averageRating={averageRating}
        pendingReplies={pendingReplies}
        repliedThisMonth={repliedThisMonth}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <SentimentChart data={trendData} />
        <RecentReviews
          reviews={reviews.slice(0, 5).map((r) => ({
            reviewerName: r.reviewerName,
            rating: r.rating,
            comment: r.comment,
            sentiment: r.sentiment,
          }))}
        />
      </div>
    </div>
  )
}
