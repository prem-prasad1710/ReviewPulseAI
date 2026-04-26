import Link from 'next/link'
import { connectDB } from '@/lib/mongodb'
import { computeReputationScore, letterGrade } from '@/lib/score-compute'
import Location from '@/models/Location'
import Review from '@/models/Review'
import User from '@/models/User'

export const revalidate = 3600

export default async function ScoreEmbedPage({ params }: { params: Promise<{ locationSlug: string }> }) {
  const { locationSlug } = await params
  await connectDB()
  const location = await Location.findOne({ locationSlug }).lean()
  if (!location) {
    return <div className="p-4 text-sm text-slate-600">Location not found.</div>
  }
  const reviews = await Review.find({ locationId: location._id }).lean()
  const owner = await User.findById(location.userId).select('plan').lean()
  const plan = (owner?.plan as string) || 'free'
  const total = reviews.length
  const replied = reviews.filter((r) => r.status === 'replied').length
  const replyRate = total > 0 ? replied / total : 0
  const positive = reviews.filter((r) => r.sentiment === 'positive').length
  const positiveRatio = total > 0 ? positive / total : 0
  const avgRating =
    total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : location.averageRating || 0
  const score = computeReputationScore({ averageRating: avgRating, replyRate, positiveRatio })
  const grade = letterGrade(score)

  return (
    <div className="min-h-[200px] rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{location.name}</p>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-3xl font-bold text-indigo-600">{score}</span>
        <span className="text-sm font-semibold text-slate-600">Grade {grade}</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {Math.round(replyRate * 100)}% reply rate · {total} reviews
      </p>
      {plan === 'free' ? (
        <Link href="/" className="mt-3 inline-block text-[10px] text-slate-400 underline">
          Powered by ReviewPulse
        </Link>
      ) : null}
    </div>
  )
}
