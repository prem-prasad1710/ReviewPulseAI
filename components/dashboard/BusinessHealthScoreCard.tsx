import Link from 'next/link'
import { ArrowDown, ArrowRight, ArrowUp, Minus, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import type { BusinessHealthScoreResult } from '@/lib/business-health-score'

function ScoreDial({ score }: { score: number }) {
  const size = 120
  const r = 48
  const strokeWidth = 10
  const circumference = Math.PI * r  // half-circle
  const pct = Math.min(1, Math.max(0, score / 100))
  const offset = circumference * (1 - pct)

  const color =
    score >= 80 ? '#10b981' :  // emerald
    score >= 65 ? '#84cc16' :  // lime
    score >= 50 ? '#f59e0b' :  // amber
    score >= 35 ? '#f97316' :  // orange
    '#ef4444'                   // red

  return (
    <svg
      viewBox={`0 0 ${size} ${size / 2 + 16}`}
      className="w-32 shrink-0"
      aria-label={`Health score: ${score}`}
    >
      {/* Background arc */}
      <path
        d={`M ${strokeWidth / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-200 dark:text-slate-700"
        strokeLinecap="round"
      />
      {/* Colored arc */}
      <path
        d={`M ${strokeWidth / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
      />
      {/* Score number */}
      <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fontSize="26" fontWeight="800" fill={color}>
        {score}
      </text>
      <text x={size / 2} y={size / 2 + 13} textAnchor="middle" fontSize="10" fill="currentColor" className="text-slate-500">
        / 100
      </text>
    </svg>
  )
}

const gradeColors: Record<string, string> = {
  'A+': 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200',
  A: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200',
  B: 'bg-lime-100 text-lime-900 dark:bg-lime-950/50 dark:text-lime-200',
  C: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
  D: 'bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200',
  F: 'bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200',
}

const dimBarColors: Record<string, string> = {
  '80+': 'bg-emerald-500',
  '60+': 'bg-lime-400',
  '40+': 'bg-amber-400',
  '20+': 'bg-orange-500',
  '0+': 'bg-rose-500',
}

function dimBarColor(pct: number): string {
  if (pct >= 0.8) return dimBarColors['80+']
  if (pct >= 0.6) return dimBarColors['60+']
  if (pct >= 0.4) return dimBarColors['40+']
  if (pct >= 0.2) return dimBarColors['20+']
  return dimBarColors['0+']
}

export default function BusinessHealthScoreCard({ result }: { result: BusinessHealthScoreResult }) {
  const TrendIcon =
    result.trend === 'up' ? ArrowUp : result.trend === 'down' ? ArrowDown : Minus
  const trendClass =
    result.trend === 'up'
      ? 'text-emerald-600 dark:text-emerald-400'
      : result.trend === 'down'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-slate-500'

  return (
    <Card className="overflow-hidden border-slate-200/90 dark:border-slate-700/80">
      <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-500" />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
            Business health score
          </p>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="flex flex-wrap items-start gap-6">
          {/* Dial + grade */}
          <div className="flex flex-col items-center gap-1">
            <ScoreDial score={result.totalScore} />
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold',
                gradeColors[result.grade] ?? gradeColors.C
              )}
            >
              Grade {result.grade} — {result.label}
            </span>
            <span className={cn('mt-1 flex items-center gap-0.5 text-xs font-semibold', trendClass)}>
              <TrendIcon className="h-3.5 w-3.5" />
              {result.trend === 'flat' ? 'Stable' : result.trend === 'up' ? 'Improving' : 'Declining'}
            </span>
          </div>

          {/* Dimension bars */}
          <div className="flex-1 space-y-3 min-w-[180px]">
            {result.dimensions.map((dim) => {
              const pct = dim.score / dim.maxScore
              return (
                <div key={dim.label}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{dim.label}</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {dim.score}/{dim.maxScore}
                    </p>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={cn('h-full rounded-full transition-all duration-700', dimBarColor(pct))}
                      style={{ width: `${Math.round(pct * 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Primary tip */}
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 dark:border-indigo-800/40 dark:bg-indigo-950/30">
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <p className="text-sm text-slate-800 dark:text-slate-200">
            <span className="font-semibold">Top priority: </span>
            {result.primaryTip}
          </p>
        </div>

        <Link
          href="/analytics"
          className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          Full analytics →
        </Link>
      </div>
    </Card>
  )
}
