import Link from 'next/link'
import { ArrowRight, MapPin, MessageSquare, Sparkles } from 'lucide-react'
import AiStudioTeaser from '@/components/dashboard/AiStudioTeaser'
import DevSampleNotice from '@/components/dashboard/DevSampleNotice'
import InsightRail from '@/components/dashboard/InsightRail'
import ProductHighlights from '@/components/dashboard/ProductHighlights'
import RecentReviews from '@/components/dashboard/RecentReviews'
import SentimentChart from '@/components/dashboard/SentimentChart'
import StatsCards from '@/components/dashboard/StatsCards'
import { Reveal } from '@/components/motion/Reveal'
import { Card, CardDescription } from '@/components/ui/card'
import { MOCK_LOCATIONS, MOCK_REVIEWS, shouldUseDashboardMocks } from '@/lib/dev-mock-dashboard'
import { getAppSession } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import Review from '@/models/Review'
import Location from '@/models/Location'

export default async function DashboardPage() {
  await connectDB()
  const session = await getAppSession()
  const userId = session?.user?.id
  const firstName = session?.user?.name?.split(/\s+/)[0] ?? 'there'
  const serverNow = new Date()
  const hour = serverNow.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const weekCutoffMs = serverNow.getTime() - 7 * 86400000

  const useMocks = shouldUseDashboardMocks()
  const reviews = useMocks
    ? MOCK_REVIEWS
    : userId
      ? await Review.find({ userId }).sort({ reviewCreatedAt: -1 }).limit(50).lean()
      : []

  const locMetrics = useMocks
    ? MOCK_LOCATIONS.map((l) => ({
        qrScans: (l as { qrScans?: number }).qrScans ?? 0,
        bridgeVisits: (l as { bridgeVisits?: number }).bridgeVisits ?? 0,
      }))
    : userId
      ? await Location.find({ userId }).select('qrScans bridgeVisits').lean()
      : []

  const qrScansTotal = locMetrics.reduce((s, l) => s + (l.qrScans || 0), 0)
  const bridgeVisitsTotal = locMetrics.reduce((s, l) => s + ((l as { bridgeVisits?: number }).bridgeVisits || 0), 0)

  const totalReviews = reviews.length
  const pendingReplies = reviews.filter((r) => r.status === 'pending' || r.status === 'scheduled').length
  const repliedThisMonth = reviews.filter((r) => r.status === 'replied').length
  const positiveReviews = reviews.filter((r) => r.sentiment === 'positive').length
  const responseRate = totalReviews > 0 ? Math.round((repliedThisMonth / totalReviews) * 100) : 0
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

  const replied = reviews.filter((r) => r.status === 'replied').length
  const negative = reviews.filter((r) => r.sentiment === 'negative').length
  const riskKeywords = /refund|charged|twice|upi|fraud|scam/i
  const riskAlerts = negative + reviews.filter((r) => r.comment && riskKeywords.test(r.comment)).length
  const weeklyReplied = reviews.filter((r) => {
    if (r.status !== 'replied') return false
    const t = new Date(r.reviewCreatedAt).getTime()
    return t >= weekCutoffMs
  }).length

  return (
    <div className="space-y-8 pb-4">
      {useMocks ? <DevSampleNotice /> : null}

      <Reveal>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{greeting}</p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
            {firstName}, here is your pulse
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/reviews"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] px-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#1f56c8]"
          >
            <MessageSquare className="h-4 w-4" />
            Inbox
          </Link>
          <Link
            href="/locations"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white/90 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <MapPin className="h-4 w-4" />
            Locations
          </Link>
        </div>
        </div>
      </Reveal>

      <Reveal delay={50}>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-700 p-6 text-white shadow-xl shadow-indigo-900/20 sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-100">
              <Sparkles className="h-3.5 w-3.5" />
              Live snapshot
            </div>
            <h3 className="font-heading text-2xl font-bold text-white sm:text-3xl">Performance at a glance</h3>
            <CardDescription className="text-base text-indigo-100">
              Response discipline and sentiment shape how new customers choose you—stay ahead in one view.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              Response rate <span className="ml-1 font-bold tabular-nums text-white">{responseRate}%</span>
            </span>
            <span className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              Positive <span className="ml-1 font-bold tabular-nums text-white">{positiveReviews}</span>
            </span>
            <span className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              Avg rating{' '}
              <span className="ml-1 font-bold tabular-nums text-white">{averageRating.toFixed(1)}</span>
            </span>
          </div>
        </div>
      </Card>
      </Reveal>

      <Reveal delay={70}>
        <InsightRail
          medianReplyHours={useMocks ? 2.4 : Math.min(6, 1.2 + pendingReplies * 0.35)}
          aiDraftsSaved={useMocks ? 142 : replied * 12 + 8}
          weeklyVolume={useMocks ? 86 : weeklyReplied * 4 + 12}
          riskAlerts={riskAlerts}
        />
      </Reveal>

      <Reveal delay={80}>
        <StatsCards
        totalReviews={totalReviews}
        averageRating={averageRating}
        pendingReplies={pendingReplies}
        repliedThisMonth={repliedThisMonth}
        qrScansTotal={qrScansTotal}
        bridgeVisitsTotal={bridgeVisitsTotal}
      />
      </Reveal>

      <Reveal delay={90}>
        <AiStudioTeaser />
      </Reveal>

      <Reveal delay={100}>
        <ProductHighlights />
      </Reveal>

      <Reveal delay={60}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/reviews"
          className="group flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-indigo-500/40"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Reply queue</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Draft and publish AI replies</p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-indigo-400" />
        </Link>
        <Link
          href="/analytics"
          className="group flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-indigo-500/40"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Sentiment mix</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Spot shifts before they compound</p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-indigo-400" />
        </Link>
        <Link
          href="/settings"
          className="group flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-indigo-500/40 sm:col-span-2 lg:col-span-1"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Plan &amp; quota</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Billing and reply limits</p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-indigo-400" />
        </Link>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
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
      </Reveal>
    </div>
  )
}
