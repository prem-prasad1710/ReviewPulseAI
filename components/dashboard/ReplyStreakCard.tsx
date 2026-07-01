import Link from 'next/link'
import { Flame, Trophy, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ReplyStreakResult } from '@/lib/reply-streak'

function StreakRing({ value, max = 30 }: { value: number; max?: number }) {
  const pct = Math.min(1, value / max)
  const r = 28
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - pct)
  const color =
    value >= 14
      ? '#f97316' // orange-500 — on fire
      : value >= 7
        ? '#eab308' // yellow-500 — hot
        : value >= 3
          ? '#6366f1' // indigo-500 — building
          : '#94a3b8' // slate-400 — starting

  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0" aria-hidden>
      <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth={6} className="text-slate-200 dark:text-slate-700" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 32 32)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="32" y="36" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>
        {value}
      </text>
    </svg>
  )
}

export default function ReplyStreakCard({
  streak,
  pendingToday,
}: {
  streak: ReplyStreakResult
  pendingToday: number
}) {
  const { currentStreak, bestStreak, todayReplied } = streak

  const isOnFire = currentStreak >= 7
  const label =
    currentStreak === 0
      ? 'No streak yet'
      : currentStreak === 1
        ? '1 day streak'
        : `${currentStreak} day streak`

  const message =
    currentStreak === 0
      ? pendingToday > 0
        ? `Reply to ${pendingToday} pending review${pendingToday > 1 ? 's' : ''} today to start your streak!`
        : "No pending reviews — great job! Reply to tomorrow's reviews to start a streak."
      : !todayReplied && pendingToday > 0
        ? `${pendingToday} pending review${pendingToday > 1 ? 's' : ''} — reply today to keep your streak alive!`
        : todayReplied
          ? 'Streak safe for today. Keep it up!'
          : 'No new reviews yet today — check back later.'

  return (
    <Card
      className={cn(
        'overflow-hidden border p-0',
        isOnFire
          ? 'border-orange-200/90 dark:border-orange-800/60'
          : 'border-slate-200/90 dark:border-slate-700/80'
      )}
    >
      <div
        className={cn(
          'px-6 py-5',
          isOnFire
            ? 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20'
            : 'bg-white dark:bg-slate-900/60'
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <StreakRing value={currentStreak} />
            <div>
              <div className="flex items-center gap-1.5">
                {isOnFire ? (
                  <Flame className="h-5 w-5 text-orange-500" />
                ) : currentStreak >= 3 ? (
                  <Zap className="h-5 w-5 text-yellow-500" />
                ) : null}
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Reply streak
                </p>
              </div>
              <h3
                className={cn(
                  'font-heading mt-0.5 text-xl font-bold',
                  isOnFire ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-slate-50'
                )}
              >
                {label}
              </h3>
              <p className="mt-1 max-w-xs text-sm text-slate-600 dark:text-slate-400">{message}</p>
            </div>
          </div>

          {bestStreak > 0 ? (
            <div className="flex shrink-0 flex-col items-center gap-0.5 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-800/60">
              <Trophy className="h-4 w-4 text-amber-500" />
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Best</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{bestStreak}</p>
            </div>
          ) : null}
        </div>

        {!todayReplied && pendingToday > 0 ? (
          <Link
            href="/reviews?status=pending"
            className="mt-4 inline-flex h-8 items-center rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Reply now →
          </Link>
        ) : null}
      </div>
    </Card>
  )
}
