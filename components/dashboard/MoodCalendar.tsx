'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { CalendarDays } from 'lucide-react'

export type DayMood = {
  date: string   // "YYYY-MM-DD"
  avgRating: number | null
  reviewCount: number
}

function moodColor(avgRating: number | null, count: number): string {
  if (count === 0 || avgRating === null)
    return 'bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60'
  if (avgRating >= 4.5)
    return 'bg-emerald-500 dark:bg-emerald-500 shadow-sm shadow-emerald-500/30'
  if (avgRating >= 3.8)
    return 'bg-lime-400 dark:bg-lime-400'
  if (avgRating >= 3.0)
    return 'bg-amber-400 dark:bg-amber-400'
  if (avgRating >= 2.0)
    return 'bg-orange-500 dark:bg-orange-500'
  return 'bg-rose-600 dark:bg-rose-600'
}

function moodLabel(avgRating: number | null, count: number): string {
  if (count === 0 || avgRating === null) return 'No reviews'
  const stars = avgRating.toFixed(1)
  const vibe =
    avgRating >= 4.5 ? 'Excellent day 🌟' :
    avgRating >= 3.8 ? 'Good day' :
    avgRating >= 3.0 ? 'Mixed day' :
    avgRating >= 2.0 ? 'Tough day' : 'Rough day 🚨'
  return `${vibe} — ${stars}★, ${count} review${count !== 1 ? 's' : ''}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })
}

export default function MoodCalendar({ days }: { days: DayMood[] }) {
  const [tooltip, setTooltip] = useState<{ date: string; label: string } | null>(null)

  // Split into rows of 7 (weeks)
  const weeks: DayMood[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <Card className="overflow-hidden border-slate-200/90 dark:border-slate-700/80">
      <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-indigo-500" />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
            Mood calendar
          </p>
        </div>
        <h3 className="font-heading mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-50">
          35-day review sentiment
        </h3>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Each square = one day. Green = great reviews, red = rough day.
        </p>
      </div>

      <div className="px-6 py-5">
        {/* Day-of-week labels */}
        <div className="mb-2 grid grid-cols-7 gap-1.5">
          {dayLabels.map((d) => (
            <p key={d} className="text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {d}
            </p>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1.5">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={cn(
                    'relative aspect-square w-full cursor-default rounded-md transition-transform hover:scale-110',
                    moodColor(day.avgRating, day.reviewCount)
                  )}
                  onMouseEnter={() => setTooltip({ date: day.date, label: moodLabel(day.avgRating, day.reviewCount) })}
                  onMouseLeave={() => setTooltip(null)}
                  aria-label={`${formatDate(day.date)}: ${moodLabel(day.avgRating, day.reviewCount)}`}
                >
                  {tooltip?.date === day.date ? (
                    <div className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
                      <p className="font-semibold">{formatDate(day.date)}</p>
                      <p className="text-slate-300 dark:text-slate-700">{tooltip.label}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Mood:</p>
          {[
            { color: 'bg-emerald-500', label: 'Excellent (≥4.5★)' },
            { color: 'bg-lime-400', label: 'Good (≥3.8★)' },
            { color: 'bg-amber-400', label: 'Mixed (≥3★)' },
            { color: 'bg-orange-500', label: 'Tough (<3★)' },
            { color: 'bg-rose-600', label: 'Rough (<2★)' },
            { color: 'bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600', label: 'No reviews' },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
              <span className={cn('inline-block h-3 w-3 rounded-sm', item.color)} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </Card>
  )
}
