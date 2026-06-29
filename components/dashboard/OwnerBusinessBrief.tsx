import Link from 'next/link'
import { AlertTriangle, ArrowRight, BarChart3, Share2, TrendingDown, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import type { OwnerBrief } from '@/lib/owner-brief'
import { cn } from '@/lib/utils'

const gradeColors: Record<OwnerBrief['grade'], string> = {
  A: 'bg-emerald-500 text-white',
  B: 'bg-lime-500 text-white',
  C: 'bg-amber-500 text-white',
  D: 'bg-orange-500 text-white',
  F: 'bg-rose-600 text-white',
}

const healthStyles: Record<OwnerBrief['locations'][0]['health'], string> = {
  excellent: 'border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200',
  good: 'border-slate-200 bg-slate-50/80 text-slate-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200',
  attention: 'border-amber-200 bg-amber-50/80 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100',
  critical: 'border-rose-200 bg-rose-50/80 text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100',
}

export default function OwnerBusinessBrief({ brief }: { brief: OwnerBrief }) {
  const TrendIcon =
    brief.ratingTrend === 'up' ? TrendingUp : brief.ratingTrend === 'down' ? TrendingDown : BarChart3

  return (
    <Card className="overflow-hidden border-slate-200/90 dark:border-slate-700/80">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/50 px-6 py-5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
              Business command center
            </p>
            <CardTitle className="font-heading mt-1 text-xl dark:text-slate-50">
              Your reputation at a glance
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl text-sm">
              One portal to track reviews, ratings, and what to do next — built for owners who run on WhatsApp, not spreadsheets.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black shadow-sm',
                gradeColors[brief.grade]
              )}
            >
              {brief.grade}
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {brief.reputationScore}
                <span className="text-sm font-normal text-slate-500">/100</span>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Top {brief.percentile}% vs India baseline · {brief.vsIndiaAvg}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pending replies" value={String(brief.pendingReplies)} alert={brief.pendingReplies > 0} />
        <Stat label="Avg rating" value={brief.avgRating.toFixed(2)} />
        <Stat label="Response rate" value={`${brief.responseRate}%`} />
        <Stat
          label="This week"
          value={
            brief.reviewsThisWeek > 0
              ? `${brief.avgRatingThisWeek.toFixed(1)}★ (${brief.reviewsThisWeek} reviews)`
              : 'No new reviews'
          }
          icon={<TrendIcon className="h-3.5 w-3.5" />}
        />
      </div>

      {brief.lowStarPending > 0 ? (
        <div className="mx-6 mb-4 flex items-start gap-2 rounded-xl border border-rose-200/90 bg-rose-50/80 px-4 py-3 text-sm text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>{brief.lowStarPending}</strong> low-star review{brief.lowStarPending === 1 ? '' : 's'} need attention
            — reply before they hurt bookings.
          </span>
        </div>
      ) : null}

      <div className="border-t border-slate-100 px-6 py-5 dark:border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended actions</p>
        <ul className="mt-3 space-y-2">
          {brief.topActions.map((action) => (
            <li key={action} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              {action}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/reviews">
            <Button size="sm" className="rounded-xl">
              Open inbox
            </Button>
          </Link>
          <Link href="/analytics">
            <Button size="sm" variant="outline" className="rounded-xl">
              View analytics
            </Button>
          </Link>
          {brief.locations[0]?.slug ? (
            <Link href={`/score/${brief.locations[0].slug}`} target="_blank">
              <Button size="sm" variant="outline" className="gap-1.5 rounded-xl">
                <Share2 className="h-3.5 w-3.5" />
                Public score page
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {brief.locations.length > 1 ? (
        <div className="border-t border-slate-100 px-6 py-5 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Outlet health</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {brief.locations.map((loc) => (
              <Link
                key={loc.id}
                href={`/locations/${loc.id}`}
                className={cn('rounded-xl border px-3 py-2.5 text-sm transition hover:shadow-sm', healthStyles[loc.health])}
              >
                <p className="font-semibold">{loc.name}</p>
                <p className="mt-0.5 text-xs opacity-90">
                  {loc.pending > 0 ? `${loc.pending} pending · ` : ''}
                  {loc.avgRating > 0 ? `${loc.avgRating.toFixed(1)}★ avg` : 'Sync for stats'}
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  )
}

function Stat({
  label,
  value,
  alert,
  icon,
}: {
  label: string
  value: string
  alert?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3',
        alert
          ? 'border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20'
          : 'border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40'
      )}
    >
      <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}
