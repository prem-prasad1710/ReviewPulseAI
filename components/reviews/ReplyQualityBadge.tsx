'use client'

import { CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReplyQualityResult } from '@/lib/reply-quality-score'

const gradeStyles: Record<ReplyQualityResult['grade'], string> = {
  A: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200',
  B: 'bg-lime-100 text-lime-900 dark:bg-lime-950/50 dark:text-lime-200',
  C: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
  D: 'bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200',
  F: 'bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200',
}

const barStyles: Record<ReplyQualityResult['grade'], string> = {
  A: 'bg-emerald-500',
  B: 'bg-lime-500',
  C: 'bg-amber-500',
  D: 'bg-orange-500',
  F: 'bg-rose-500',
}

export default function ReplyQualityBadge({ result }: { result: ReplyQualityResult }) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-3 dark:border-slate-700/80 dark:bg-slate-900/50">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Reply quality score
        </p>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
            gradeStyles[result.grade]
          )}
        >
          {result.grade} &mdash; {result.label}
        </span>
      </div>

      {/* Score bar */}
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barStyles[result.grade])}
          style={{ width: `${result.score}%` }}
        />
      </div>

      {result.highlights.length > 0 && (
        <ul className="mb-2 space-y-1">
          {result.highlights.map((h) => (
            <li key={h} className="flex items-start gap-1.5 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {h}
            </li>
          ))}
        </ul>
      )}

      {result.tips.length > 0 && (
        <ul className="space-y-1">
          {result.tips.map((t) => (
            <li key={t} className="flex items-start gap-1.5 text-xs text-amber-900 dark:text-amber-200">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
