import {
  Activity,
  AlertTriangle,
  BarChart3,
  MapPin,
  MessageCircle,
  PieChart,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { MOCK_LOCATIONS, MOCK_REVIEWS, shouldUseDashboardMocks } from '@/lib/dev-mock-dashboard'
import { getAppSession } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import Review from '@/models/Review'
import Location from '@/models/Location'

type ReviewLean = {
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore?: number
  rating: number
  status: string
  comment?: string
  reviewCreatedAt: Date
  locationId: unknown
}

const riskKeywords = /refund|charged|twice|upi|fraud|scam/i

function isoDay(d: Date) {
  return new Date(d).toISOString().slice(0, 10)
}

function lastNDaysLabels(n: number) {
  const out: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    out.push(isoDay(d))
  }
  return out
}

export default async function AnalyticsPage() {
  await connectDB()
  const session = await getAppSession()
  const useMocks = shouldUseDashboardMocks()
  const userId = session?.user?.id

  const reviews: ReviewLean[] = useMocks
    ? (MOCK_REVIEWS as unknown as ReviewLean[])
    : userId
      ? ((await Review.find({ userId }).sort({ reviewCreatedAt: -1 }).lean()) as unknown as ReviewLean[])
      : []

  const locationNameById = new Map<string, string>()
  if (useMocks) {
    MOCK_LOCATIONS.forEach((l) => locationNameById.set(String(l._id), l.name))
  } else if (userId && reviews.length > 0) {
    const ids = [...new Set(reviews.map((r) => String(r.locationId)))]
    const locs = await Location.find({ userId, _id: { $in: ids } })
      .select('name')
      .lean()
    locs.forEach((l) => locationNameById.set(String(l._id), (l as { name: string }).name))
  }

  const sentimentCounts = reviews.reduce(
    (acc, review) => {
      acc[review.sentiment] += 1
      return acc
    },
    { positive: 0, neutral: 0, negative: 0 }
  )

  const n = reviews.length
  const avgStars = n > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / n : 0
  const pending = reviews.filter((r) => r.status === 'pending' || r.status === 'scheduled').length
  const replied = reviews.filter((r) => r.status === 'replied').length
  const replyCoverage = n > 0 ? Math.round((replied / n) * 100) : 0
  const npsStyle =
    sentimentCounts.positive / Math.max(1, n) - sentimentCounts.negative / Math.max(1, n)

  const avgSentimentSignal = n > 0 ? reviews.reduce((s, r) => s + (r.sentimentScore ?? 0), 0) / n : 0

  const ratingBuckets = [1, 2, 3, 4, 5].map((star) => reviews.filter((r) => r.rating === star).length)
  const maxBucket = Math.max(1, ...ratingBuckets)

  const dayKeys = lastNDaysLabels(7)
  const volumeByDay = dayKeys.map((key) => ({
    key,
    label: new Date(key + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
    count: reviews.filter((r) => isoDay(new Date(r.reviewCreatedAt)) === key).length,
  }))
  const maxVol = Math.max(1, ...volumeByDay.map((d) => d.count))

  const mid = Math.floor(dayKeys.length / 2)
  const recentHalf = volumeByDay.slice(mid).reduce((s, d) => s + d.count, 0)
  const olderHalf = volumeByDay.slice(0, mid).reduce((s, d) => s + d.count, 0)
  const volumeDelta =
    olderHalf === 0 ? (recentHalf > 0 ? 100 : 0) : Math.round(((recentHalf - olderHalf) / olderHalf) * 100)

  const withComment = reviews.filter((r) => (r.comment || '').trim().length > 0).length
  const commentRate = n > 0 ? Math.round((withComment / n) * 100) : 0
  const promoters = reviews.filter((r) => r.rating >= 4).length
  const detractors = reviews.filter((r) => r.rating <= 2).length
  const promoterPct = n > 0 ? Math.round((promoters / n) * 100) : 0
  const detractorPct = n > 0 ? Math.round((detractors / n) * 100) : 0
  const riskMatches = reviews.filter((r) => r.comment && riskKeywords.test(r.comment)).length

  const byLocation = new Map<string, { count: number; sum: number; pending: number }>()
  reviews.forEach((r) => {
    const id = String(r.locationId)
    const cur = byLocation.get(id) || { count: 0, sum: 0, pending: 0 }
    cur.count += 1
    cur.sum += r.rating
    if (r.status === 'pending' || r.status === 'scheduled') cur.pending += 1
    byLocation.set(id, cur)
  })
  const locationRows = [...byLocation.entries()]
    .map(([id, v]) => ({
      id,
      name: locationNameById.get(id) || `Location ${id.slice(-6)}`,
      count: v.count,
      avg: v.count ? (v.sum / v.count).toFixed(2) : '0',
      pending: v.pending,
    }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-8 pb-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Analytics</p>
        <h2 className="font-heading mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
          Sentiment &amp; velocity
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Deeper view of rating mix, reply coverage, volume, and location-level performance—so you know where to act
          first.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total reviews', value: n.toLocaleString('en-IN'), hint: 'Synced into ReviewPulse' },
          { label: 'Avg rating', value: n ? avgStars.toFixed(2) : '—', hint: 'Mean stars across inbox' },
          { label: 'Reply coverage', value: n ? `${replyCoverage}%` : '—', hint: 'Share already replied' },
          {
            label: 'Sentiment signal',
            value: n ? avgSentimentSignal.toFixed(2) : '—',
            hint: 'Model score −1…1 (higher is better)',
          },
        ].map((k) => (
          <Card
            key={k.label}
            className="border-slate-200/90 bg-gradient-to-br from-white to-slate-50/80 dark:border-slate-700/80 dark:from-slate-900/70 dark:to-slate-950/50"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{k.label}</p>
            <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">{k.value}</p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{k.hint}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-emerald-200/70 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <CardTitle className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{sentimentCounts.positive}</CardTitle>
          <CardDescription className="text-emerald-900/80 dark:text-emerald-200/80">Positive reviews</CardDescription>
        </Card>
        <Card className="border-amber-200/70 bg-amber-50/25 dark:border-amber-900/40 dark:bg-amber-950/20">
          <CardTitle className="text-3xl font-bold text-amber-700 dark:text-amber-400">{sentimentCounts.neutral}</CardTitle>
          <CardDescription className="text-amber-900/80 dark:text-amber-200/80">Neutral / mixed</CardDescription>
        </Card>
        <Card className="border-rose-200/70 bg-rose-50/25 dark:border-rose-900/40 dark:bg-rose-950/20">
          <CardTitle className="text-3xl font-bold text-rose-700 dark:text-rose-400">{sentimentCounts.negative}</CardTitle>
          <CardDescription className="text-rose-900/80 dark:text-rose-200/80">Negative reviews</CardDescription>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="dark:border-slate-700/80 dark:bg-slate-900/60">
          <div className="mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <PieChart className="h-5 w-5" />
            <CardTitle className="text-base dark:text-slate-100">Rating distribution</CardTitle>
          </div>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Share of reviews at each star level.</p>
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingBuckets[star - 1]
              const pct = Math.round((count / maxBucket) * 100)
              return (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="w-8 shrink-0 font-medium tabular-nums text-slate-600 dark:text-slate-300">{star}★</span>
                  <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 dark:from-indigo-400 dark:to-violet-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="dark:border-slate-700/80 dark:bg-slate-900/60">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Activity className="h-5 w-5" />
              <CardTitle className="text-base dark:text-slate-100">Volume (last 7 days)</CardTitle>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                volumeDelta >= 0
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
              }`}
            >
              {volumeDelta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {volumeDelta >= 0 ? '+' : ''}
              {volumeDelta}% vs prior week
            </span>
          </div>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">New reviews per calendar day (UTC date).</p>
          <div className="flex h-[7.5rem] items-end gap-1.5 sm:gap-2">
            {volumeByDay.map((d) => {
              const barPx = Math.max(6, Math.round((d.count / maxVol) * 104))
              return (
                <div key={d.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <div
                    className="w-full max-w-[2.75rem] rounded-t-md bg-gradient-to-t from-indigo-600 to-violet-400 opacity-90 shadow-sm dark:from-indigo-500 dark:to-violet-400"
                    style={{ height: `${barPx}px` }}
                    title={`${d.count} reviews on ${d.key}`}
                  />
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{d.label}</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="dark:border-slate-700/80 dark:bg-slate-900/60">
          <div className="mb-2 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="h-5 w-5" />
            <CardTitle className="text-base dark:text-slate-100">Inbox &amp; quality</CardTitle>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{pending}</p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Open replies</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{commentRate}%</p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">With written text</p>
            </div>
          </div>
          <CardDescription className="mt-3 text-xs dark:text-slate-400">
            Open replies include pending and scheduled. Text rate helps estimate how much context AI can use.
          </CardDescription>
        </Card>

        <Card className="dark:border-slate-700/80 dark:bg-slate-900/60">
          <div className="mb-2 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-5 w-5" />
            <CardTitle className="text-base dark:text-slate-100">Promoters &amp; risk</CardTitle>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/25">
              <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{promoterPct}%</p>
              <p className="text-[11px] font-medium text-emerald-900/80 dark:text-emerald-200/80">4–5★ promoters</p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 dark:border-rose-900/40 dark:bg-rose-950/25">
              <p className="text-2xl font-bold text-rose-800 dark:text-rose-300">{detractorPct}%</p>
              <p className="text-[11px] font-medium text-rose-900/80 dark:text-rose-200/80">1–2★ detractors</p>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-100/90 bg-amber-50/50 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-950/20">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-950/90 dark:text-amber-100/90">
              <span className="font-semibold">{riskMatches}</span> reviews match payment/refund risk keywords—prioritize
              in the inbox.
            </p>
          </div>
        </Card>
      </div>

      <Card className="dark:border-slate-700/80 dark:bg-slate-900/60">
        <div className="mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <MapPin className="h-5 w-5" />
          <CardTitle className="text-base dark:text-slate-100">Performance by location</CardTitle>
        </div>
        {locationRows.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No location data yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700/80">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Reviews</th>
                  <th className="px-4 py-3">Avg rating</th>
                  <th className="px-4 py-3">Open</th>
                </tr>
              </thead>
              <tbody>
                {locationRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800/80"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{row.name}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{row.count}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{row.avg}</td>
                    <td className="px-4 py-3">
                      {row.pending > 0 ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                          {row.pending} open
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Clear</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="dark:border-slate-700/80 dark:bg-slate-900/60">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {npsStyle >= 0 ? (
              <TrendingUp className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="h-5 w-5 text-rose-500 dark:text-rose-400" />
            )}
            <CardTitle className="text-base dark:text-slate-100">Momentum index</CardTitle>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {(npsStyle * 100).toFixed(0)} pts
          </span>
        </div>
        <CardDescription className="text-sm dark:text-slate-400">
          Positive minus negative share of your inbox—use alongside the 7-day volume bars to see whether sentiment is
          improving as volume grows.
        </CardDescription>
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span>
            Tip: Pair this page with the dashboard trend chart for a full picture of rating trajectory over time.
          </span>
        </div>
      </Card>
    </div>
  )
}
