'use client'

import { MessageSquareText, Timer, Languages } from 'lucide-react'
import { cn } from '@/lib/utils'

const CHIPS = [
  { label: '217+ reviews handled', sub: 'Inbox zero mindset', Icon: MessageSquareText },
  { label: 'Under 10 min go-live', sub: 'OAuth + sync', Icon: Timer },
  { label: 'Hindi · English', sub: 'Natural tone', Icon: Languages },
] as const

export default function LandingStatChips() {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {CHIPS.map(({ label, sub, Icon }) => (
        <div
          key={label}
          className={cn(
            'group flex items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm transition',
            'hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md active:scale-[0.99]',
            'dark:border-slate-600/80 dark:bg-slate-900/70 dark:hover:border-indigo-500/40'
          )}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/80 dark:text-indigo-200 dark:group-hover:bg-indigo-600 dark:group-hover:text-white">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <div className="text-left leading-tight">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-50">{label}</p>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
