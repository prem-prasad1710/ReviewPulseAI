import Link from 'next/link'
import { ArrowRight, MapPin, MessageSquare, Sparkles } from 'lucide-react'
import AiStudioTeaser from '@/components/dashboard/AiStudioTeaser'
import DevSampleNotice from '@/components/dashboard/DevSampleNotice'
import InsightRail from '@/components/dashboard/InsightRail'
import OwnerCoachCard from '@/components/dashboard/OwnerCoachCard'
import ProductHighlights from '@/components/dashboard/ProductHighlights'
import RecentReviews from '@/components/dashboard/RecentReviews'
import ReviewSummaryCard from '@/components/dashboard/ReviewSummaryCard'
import ReputationRecoveryCard from '@/components/dashboard/ReputationRecoveryCard'
import SentimentChart from '@/components/dashboard/SentimentChart'
import StatsCards from '@/components/dashboard/StatsCards'
import WhyCustomersLeaveCard from '@/components/dashboard/WhyCustomersLeaveCard'
import { Reveal } from '@/components/motion/Reveal'
import { Card, CardDescription } from '@/components/ui/card'
import { MOCK_LOCATIONS, MOCK_REVIEWS, shouldUseDashboardMocks } from '@/lib/dev-mock-dashboard'
import { bucketNegativeReviewThemes } from '@/lib/reputation-themes'
import { getAppSession } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { buildOwnerBrief } from '@/lib/owner-brief'
import CrisisRadarCard from '@/components/dashboard/CrisisRadarCard'
import OwnerBusinessBrief from '@/components/dashboard/OwnerBusinessBrief'
import VelocitySpikeCard from '@/components/dashboard/VelocitySpikeCard'
import type { SpikeData } from '@/components/dashboard/VelocitySpikeCard'
import ReplyStreakCard from '@/components/dashboard/ReplyStreakCard'
import MoodCalendar from '@/components/dashboard/MoodCalendar'
import type { DayMood } from '@/components/dashboard/MoodCalendar'
import BusinessHealthScoreCard from '@/components/dashboard/BusinessHealthScoreCard'
import FirstRunChecklist from '@/components/onboarding/FirstRunChecklist'
import TrialBanner from '@/components/billing/TrialBanner'
import User from '@/models/User'
import Review from '@/models/Review'
import Location from '@/models/Location'
import ReviewAlert from '@/models/ReviewAlert'
import type { IUserLean } from '@/types'
import { computeReplyStreak } from '@/lib/reply-streak'
import { computeBusinessHealthScore } from '@/lib/business-health-score'
import { toISTDateKey } from '@/lib/reply-streak'
import CustomerThemesCard from '@/components/dashboard/CustomerThemesCard'

export default async function DashboardPage() {
  await connectDB()
  const session = await getAppSession()
  const userId = session?.user?.id
  const dbUser = userId ? ((await User.findById(userId).lean()) as IUserLean | null) : null
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

  const allReviewsForBrief =
    !useMocks && userId
      ? await Review.find({ userId })
          .select('locationId rating sentiment status comment reviewCreatedAt')
          .sort({ reviewCreatedAt: -1 })
          .limit(500)
          .lean()
      : []

  const locationDocs =
    !useMocks && userId
      ? await Location.find({ userId, isActive: true })
          .select('_id name locationSlug lastSyncedAt')
          .sort({ createdAt: -1 })
          .lean()
      : []

  const ownerBrief =
    !useMocks && userId && (allReviewsForBrief.length > 0 || locationDocs.length > 0)
      ? buildOwnerBrief(
          allReviewsForBrief.map((r) => ({
            locationId: String(r.locationId),
            rating: r.rating,
            sentiment: r.sentiment,
            status: r.status,
            comment: r.comment,
            reviewCreatedAt: r.reviewCreatedAt,
          })),
          locationDocs.map((l) => ({
            _id: String(l._id),
            name: l.name,
            locationSlug: l.locationSlug,
            lastSyncedAt: l.lastSyncedAt,
          }))
        )
      : null

  const velocitySpikes: SpikeData[] =
    !useMocks && userId
      ? await (async () => {
          const locs = await Location.find({ userId, isActive: true })
            .select('_id name')
            .lean()
          const h24 = new Date(Date.now() - 24 * 3600_000)
          const h6 = new Date(Date.now() - 6 * 3600_000)
          const spikes: SpikeData[] = []
          for (const loc of locs) {
            const recent24 = await Review.find({
              locationId: loc._id,
              reviewCreatedAt: { $gte: h24 },
            })
              .select('rating reviewCreatedAt')
              .lean()
            if (recent24.length === 0) continue
            const recent6neg = recent24.filter(
              (r) => r.rating <= 2 && new Date(r.reviewCreatedAt).getTime() >= h6.getTime()
            )
            const avg24 = recent24.reduce((s, r) => s + r.rating, 0) / recent24.length
            const pos4 = recent24.filter((r) => r.rating >= 4)
            if (recent6neg.length >= 2) {
              spikes.push({ locationId: String(loc._id), locationName: loc.name, kind: 'negative_attack', reviewCount: recent6neg.length, windowHours: 6, avgRating: Math.round(avg24 * 10) / 10 })
            } else if (recent24.length >= 3 && avg24 < 3.0) {
              spikes.push({ locationId: String(loc._id), locationName: loc.name, kind: 'volume_spike', reviewCount: recent24.length, windowHours: 24, avgRating: Math.round(avg24 * 10) / 10 })
            } else if (pos4.length >= 4) {
              spikes.push({ locationId: String(loc._id), locationName: loc.name, kind: 'positive_surge', reviewCount: pos4.length, windowHours: 24, avgRating: Math.round(avg24 * 10) / 10 })
            }
          }
          return spikes
        })()
      : []

  const crisisAlerts =
    !useMocks && userId
      ? await (async () => {
          const since = new Date()
          since.setDate(since.getDate() - 30)
          const rows = await ReviewAlert.find({
            userId,
            type: 'crisis',
            createdAt: { $gte: since },
          })
            .sort({ createdAt: -1 })
            .limit(8)
            .populate('locationId', 'name')
            .lean()
          return rows.map((r) => ({
            id: String(r._id),
            keyword: r.keyword,
            locationName:
              typeof r.locationId === 'object' && r.locationId && 'name' in r.locationId
                ? String((r.locationId as { name: string }).name)
                : 'Location',
            reviewId: String(r.reviewId),
            createdAt: r.createdAt,
          }))
        })()
      : []

  // ── Reply Streak ──────────────────────────────────────────────────────────
  const replyStreak =
    !useMocks && userId
      ? await computeReplyStreak(userId)
      : { currentStreak: 0, bestStreak: 0, todayReplied: false }

  // ── Mood Calendar (35 days, IST-keyed) — separate query avoids the 50-review cap ──
  const moodCalendarDays: DayMood[] = await (async () => {
    const days: DayMood[] = []
    if (useMocks || !userId) {
      // Mock: last 35 days with random data
      const todayIST = toISTDateKey(new Date())
      for (let i = 34; i >= 0; i--) {
        const d = new Date(new Date(todayIST + 'T12:00:00+05:30').getTime() - i * 86400_000)
        const key = toISTDateKey(d)
        days.push({ date: key, avgRating: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 4.8 : 4.0, reviewCount: i % 4 === 0 ? 0 : 2 })
      }
      return days
    }
    const since35 = new Date(Date.now() - 35 * 86400_000)
    const calReviews = await Review.find({
      userId,
      reviewCreatedAt: { $gte: since35 },
    })
      .select('rating reviewCreatedAt')
      .lean()

    const dayRating = new Map<string, { total: number; count: number }>()
    for (const r of calReviews) {
      const key = toISTDateKey(new Date(r.reviewCreatedAt))
      const prev = dayRating.get(key) || { total: 0, count: 0 }
      dayRating.set(key, { total: prev.total + r.rating, count: prev.count + 1 })
    }
    const todayIST = toISTDateKey(new Date())
    for (let i = 34; i >= 0; i--) {
      const d = new Date(new Date(todayIST + 'T12:00:00+05:30').getTime() - i * 86400_000)
      const key = toISTDateKey(d)
      const data = dayRating.get(key)
      days.push({
        date: key,
        avgRating: data ? Math.round((data.total / data.count) * 10) / 10 : null,
        reviewCount: data?.count ?? 0,
      })
    }
    return days
  })()

  // ── Business Health Score ─────────────────────────────────────────────────
  const healthScore = !useMocks && userId
    ? computeBusinessHealthScore({
        totalReviews: reviews.length,
        avgRating: reviews.length > 0
          ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
          : 0,
        repliedCount: reviews.filter((r) => r.status === 'replied').length,
        pendingCount: reviews.filter((r) => r.status === 'pending').length,
        crisisLast30Days: crisisAlerts.length,
        reviewsLast7Days: reviews.filter(
          (r) => new Date(r.reviewCreatedAt).getTime() >= weekCutoffMs
        ).length,
        highFakeScoreCount: reviews.filter(
          (r) => typeof (r as { fakeScore?: number }).fakeScore === 'number' &&
            ((r as { fakeScore?: number }).fakeScore ?? 0) >= 70
        ).length,
      })
    : null

  const locMetrics = useMocks
    ? MOCK_LOCATIONS.map((l) => ({
        qrScans: (l as { qrScans?: number }).qrScans ?? 0,
        bridgeVisits: (l as { bridgeVisits?: number }).bridgeVisits ?? 0,
      }))
    : userId
      ? await Location.find({ userId }).select('qrScans bridgeVisits').lean()
      : []

  const locationCount = useMocks ? MOCK_LOCATIONS.length : userId ? locMetrics.length : 0

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

  const lowStarPending = reviews.filter(
    (r) => r.rating <= 2 && (r.status === 'pending' || r.status === 'scheduled')
  ).length
  const recoveredCount = reviews.filter((r) => Boolean((r as { ratingRecovered?: boolean }).ratingRecovered)).length
  const negComments = reviews
    .filter((r) => (r.rating <= 3 || r.sentiment === 'negative') && (r.comment || '').trim().length > 4)
    .map((r) => String(r.comment))
  const themeBuckets = useMocks
    ? [
        { id: 'wait_time', label: 'Waiting / queue', count: 4 },
        { id: 'staff', label: 'Staff attitude', count: 2 },
        { id: 'food_quality', label: 'Taste / food quality', count: 2 },
      ]
    : bucketNegativeReviewThemes(negComments)

  return (
    <div className="space-y-8 pb-4">
      {useMocks ? <DevSampleNotice /> : null}
      {dbUser && !useMocks ? <TrialBanner user={dbUser} /> : null}
      {!useMocks && userId && dbUser ? (
        <FirstRunChecklist
          hasLocations={locationCount > 0}
          hasReviews={totalReviews > 0}
          pendingCount={pendingReplies}
          whatsappConfigured={Boolean(dbUser.whatsappNumber && dbUser.whatsappAlertsEnabled !== false)}
        />
      ) : null}

      {!useMocks && ownerBrief ? (
        <Reveal delay={20}>
          <OwnerBusinessBrief brief={ownerBrief} />
        </Reveal>
      ) : null}

      {!useMocks && crisisAlerts.length > 0 ? (
        <Reveal delay={25}>
          <CrisisRadarCard alerts={crisisAlerts} />
        </Reveal>
      ) : null}

      {!useMocks && velocitySpikes.length > 0 ? (
        <Reveal delay={28}>
          <VelocitySpikeCard spikes={velocitySpikes} />
        </Reveal>
      ) : null}

      {!useMocks && healthScore ? (
        <Reveal delay={30}>
          <div className="grid gap-6 lg:grid-cols-2">
            <BusinessHealthScoreCard result={healthScore} />
            <ReplyStreakCard
              streak={replyStreak}
              pendingToday={pendingReplies}
            />
          </div>
        </Reveal>
      ) : null}

      {!useMocks && moodCalendarDays.some((d) => d.reviewCount > 0) ? (
        <Reveal delay={32}>
          <MoodCalendar days={moodCalendarDays} />
        </Reveal>
      ) : null}

      {!useMocks && userId ? (
        <Reveal delay={34}>
          <CustomerThemesCard />
        </Reveal>
      ) : null}

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

      {!useMocks && userId && locationCount === 0 ? (
        <Reveal delay={55}>
          <Card className="border-indigo-200/80 bg-indigo-50/50 p-5 dark:border-indigo-500/30 dark:bg-indigo-950/25 sm:p-6">
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-50">Connect Google Business in ~90 seconds</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Same Google account that owns your listings. We import outlets, sync reviews, and surface AI drafts fast
              so you feel momentum quickly.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/locations/connect"
                prefetch={false}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f56c8]"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Connect Google &amp; import locations
              </Link>
              <Link
                href="/locations"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Locations page
              </Link>
            </div>
          </Card>
        </Reveal>
      ) : null}

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

      {userId && !useMocks ? (
        <Reveal delay={81}>
          <ReviewSummaryCard />
        </Reveal>
      ) : null}

      <Reveal delay={82}>
        {useMocks || (userId && locationCount > 0) ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <ReputationRecoveryCard lowStarPending={lowStarPending} recoveredCount={recoveredCount} />
            <WhyCustomersLeaveCard buckets={themeBuckets} />
            <OwnerCoachCard />
          </div>
        ) : null}
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
