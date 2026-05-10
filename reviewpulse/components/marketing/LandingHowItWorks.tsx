'use client'

import { useState } from 'react'
import { Link2, MousePointerClick, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    id: 0,
    label: '01',
    title: 'Connect',
    text: 'Connect Google Business Profile with secure OAuth.',
    Icon: Link2,
  },
  {
    id: 1,
    label: '02',
    title: 'Sync',
    text: 'Sync every location and review on a schedule you control.',
    Icon: RefreshCw,
  },
  {
    id: 2,
    label: '03',
    title: 'Reply',
    text: 'Generate, edit, and publish AI replies with one click.',
    Icon: MousePointerClick,
  },
] as const

export default function LandingHowItWorks() {
  const [active, setActive] = useState(0)

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white/90 p-8 shadow-sm backdrop-blur-sm dark:border-slate-700/90 dark:bg-slate-900/80 md:p-10">
      <h3 className="mb-2 text-center font-heading text-2xl font-bold text-slate-900 dark:text-slate-50 md:text-3xl">How it works</h3>
      <p className="mx-auto mb-8 max-w-xl text-center text-sm text-slate-600 dark:text-slate-400">
        Tap a step to highlight the flow — three moves from signup to published replies.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step) => {
          const isActive = active === step.id
          const Icon = step.Icon

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActive(step.id)}
              className={cn(
                'motion-safe:transition-all flex w-full flex-col rounded-2xl border p-5 text-left outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-indigo-500 md:min-h-[11rem]',
                isActive
                  ? 'border-indigo-400 bg-gradient-to-b from-indigo-50/95 to-white shadow-lg shadow-indigo-900/10 ring-1 ring-indigo-500/15 dark:border-indigo-500/50 dark:from-indigo-950/60 dark:to-slate-900/95 dark:shadow-indigo-950/20'
                  : 'border-slate-100 bg-gradient-to-b from-slate-50/80 to-white hover:border-indigo-200/80 hover:shadow-md dark:border-slate-600/70 dark:from-slate-800/80 dark:to-slate-900/90 dark:hover:border-indigo-500/35'
              )}
            >
              <div className="mb-3 flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl border text-indigo-600 transition dark:text-indigo-300',
                    isActive
                      ? 'border-indigo-300 bg-white shadow-sm motion-safe:scale-105 dark:border-indigo-500/50 dark:bg-indigo-950/80'
                      : 'border-slate-200/90 bg-white/80 dark:border-slate-600 dark:bg-slate-800/80'
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Step {step.label}</p>
                  <p className="font-heading text-sm font-semibold text-slate-900 dark:text-slate-50">{step.title}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{step.text}</p>
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex justify-center gap-2" role="tablist" aria-label="How it works steps">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className={cn(
              'h-2 rounded-full transition-all',
              active === i ? 'w-8 bg-indigo-600 dark:bg-indigo-400' : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500'
            )}
          />
        ))}
      </div>
    </section>
  )
}
