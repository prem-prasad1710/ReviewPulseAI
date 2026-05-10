import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ScoreLineChart, ScorePieChart } from '@/components/score/ScoreCharts'
import { connectDB } from '@/lib/mongodb'
import { computeReputationScore, letterGrade } from '@/lib/score-compute'
import Location from '@/models/Location'
import Review from '@/models/Review'
import User from '@/models/User'

export const revalidate = 3600

async function loadScoreData(locationSlug: string) {
  await connectDB()
  const location = await Location.findOne({ locationSlug }).lean()
  if (!location) return null
  const reviews = await Review.find({ locationId: location._id }).sort({ reviewCreatedAt: -1 }).lean()
  const owner = await User.findById(location.userId).select('plan').lean()
  return { location, reviews, plan: (owner?.plan as string) || 'free' }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locationSlug: string }>
}): Promise<Metadata> {
  const { locationSlug } = await params
  const data = await loadScoreData(locationSlug)
  if (!data) return { title: 'Reputation score' }
  const base = process.env.NEXT_PUBLIC_APP_URL || ''
  return {
    title: `${data.location.name} — Reputation score | ReviewPulse`,
    description: `Public reputation scorecard for ${data.location.name}.`,
    openGraph: {
      images: base ? [`${base}/api/og/score/${locationSlug}`] : [`/api/og/score/${locationSlug}`],
    },
  }
}

export default async function PublicScorePage({ params }: { params: Promise<{ locationSlug: string }> }) {
  const { locationSlug } = await params
  const data = await loadScoreData(locationSlug)
  if (!data) notFound()

  const { location, reviews, plan } = data
  const total = reviews.length
  const replied = reviews.filter((r) => r.status === 'replied').length
  const replyRate = total > 0 ? replied / total : 0
  const positive = reviews.filter((r) => r.sentiment === 'positive').length
  const neutral = reviews.filter((r) => r.sentiment === 'neutral').length
  const negative = reviews.filter((r) => r.sentiment === 'negative').length
  const positiveRatio = total > 0 ? positive / total : 0
  const avgRating =
    total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : location.averageRating || 0
  const score = computeReputationScore({ averageRating: avgRating, replyRate, positiveRatio })
  const grade = letterGrade(score)
  const isFree = plan === 'free'

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const recent = reviews.filter((r) => new Date(r.reviewCreatedAt) >= sixMonthsAgo)
  const byWeek = new Map<string, { sum: number; n: number }>()
  for (const r of recent) {
    const d = new Date(r.reviewCreatedAt)
    const key = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`
    const prev = byWeek.get(key) || { sum: 0, n: 0 }
    byWeek.set(key, { sum: prev.sum + r.rating, n: prev.n + 1 })
  }
  const trend = Array.from(byWeek.entries())
    .slice(-12)
    .map(([label, v]) => ({ label, avg: Number((v.sum / v.n).toFixed(2)) }))

  const pieData = [
    { name: 'Positive', value: positive },
    { name: 'Neutral', value: neutral },
    { name: 'Negative', value: negative },
  ].filter((d) => d.value > 0)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Reputation scorecard
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">{location.name}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{location.address}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase text-slate-500">Score</p>
            <p className="text-4xl font-bold tabular-nums text-indigo-600 dark:text-indigo-400">{score}</p>
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">Grade {grade}</p>
          </div>
        </div>

        {isFree ? (
          <p className="mt-6 text-center text-xs text-slate-500">
            Powered by{' '}
            <Link href="/" className="font-semibold text-indigo-600 underline dark:text-indigo-400">
              ReviewPulse
            </Link>
          </p>
        ) : location.logoUrl ? (
          <div className="mt-6 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={location.logoUrl} alt="" className="h-12 object-contain" />
          </div>
        ) : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">6-month rating trend</h2>
            {trend.length > 0 ? (
              <ScoreLineChart data={trend} />
            ) : (
              <p className="mt-8 text-sm text-slate-500">Not enough recent reviews for a trend yet.</p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Sentiment</h2>
            {pieData.length > 0 ? (
              <ScorePieChart data={pieData} />
            ) : (
              <p className="mt-8 text-sm text-slate-500">No sentiment data yet.</p>
            )}
          </div>
        </div>

        <dl className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <dt className="text-xs font-medium uppercase text-slate-500">Reply rate</dt>
            <dd className="text-2xl font-bold tabular-nums">{Math.round(replyRate * 100)}%</dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <dt className="text-xs font-medium uppercase text-slate-500">Total reviews</dt>
            <dd className="text-2xl font-bold tabular-nums">{total}</dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <dt className="text-xs font-medium uppercase text-slate-500">Avg rating</dt>
            <dd className="text-2xl font-bold tabular-nums">{avgRating.toFixed(1)} / 5</dd>
          </div>
        </dl>

        {!isFree ? (
          <p className="mt-10 text-center text-xs text-slate-500">
            Embed:{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] dark:bg-slate-800">
              {`<iframe src="${process.env.NEXT_PUBLIC_APP_URL || ''}/score/${locationSlug}/embed" title="Reputation" />`}
            </code>
          </p>
        ) : null}
      </div>
    </div>
  )
}
