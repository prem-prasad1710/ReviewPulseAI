'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Link2, MousePointerClick, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

const AUTO_MS = 5200

export default function LandingHowItWorks() {
  const [active, setActive] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const pausedRef = useRef(false)

  const go = useCallback((i: number) => {
    const len = STEPS.length
    setActive(((i % len) + len) % len)
  }, [])

  useEffect(() => {
    if (STEPS.length <= 1) return
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const t = window.setInterval(() => {
      if (pausedRef.current) return
      setActive((a) => (a + 1) % STEPS.length)
    }, AUTO_MS)
    return () => window.clearInterval(t)
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white via-slate-50/40 to-indigo-50/20 p-8 shadow-md ring-1 ring-slate-900/[0.04] backdrop-blur-sm dark:border-slate-700/90 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-indigo-950/20 dark:shadow-none dark:ring-white/[0.06] md:p-10"
      onMouseEnter={() => {
        pausedRef.current = true
      }}
      onMouseLeave={() => {
        pausedRef.current = false
      }}
      onFocusCapture={() => {
        pausedRef.current = true
      }}
      onBlurCapture={(e) => {
        if (!sectionRef.current?.contains(e.relatedTarget as Node)) pausedRef.current = false
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-30" aria-hidden>
        <div
          className="landing-how-bg-shimmer absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(90deg, transparent 0%, rgb(99 102 241 / 0.06) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      </div>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-center sm:text-left">
          <h3 className="mb-2 font-heading text-2xl font-bold text-slate-900 dark:text-slate-50 md:text-3xl">How it works</h3>
          <p className="mx-auto max-w-xl text-sm text-slate-600 dark:text-slate-400 sm:mx-0">
            Tap a step or use arrows — the flow advances automatically, too.
          </p>
        </div>
        <div className="flex justify-center gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-9 rounded-full border-indigo-200/90 bg-white/95 p-0 shadow-sm hover:border-indigo-400 hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-indigo-400"
            aria-label="Previous step"
            onClick={() => go(active - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-9 rounded-full border-indigo-200/90 bg-white/95 p-0 shadow-sm hover:border-indigo-400 hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-indigo-400"
            aria-label="Next step"
            onClick={() => go(active + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Electric connector — progress between steps */}
      <div className="relative mx-auto mt-8 hidden h-1 max-w-md overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-700/80 md:block" aria-hidden>
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-500 opacity-90 shadow-[0_0_12px_rgba(99,102,241,0.45)] transition-[width] duration-500 ease-out dark:shadow-[0_0_16px_rgba(129,140,248,0.35)]"
          style={{ width: `${((active + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="relative mt-6 grid gap-4 md:grid-cols-3 md:gap-5">
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
                  ? 'border-indigo-400 bg-gradient-to-b from-indigo-50/98 to-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/20 dark:border-indigo-500/55 dark:from-indigo-950/70 dark:to-slate-900/98 dark:shadow-indigo-950/25 dark:ring-indigo-400/20'
                  : 'border-slate-200/90 bg-white/80 hover:border-indigo-200 hover:shadow-md dark:border-slate-600/70 dark:bg-slate-800/50 dark:hover:border-indigo-500/40'
              )}
            >
              <div className="mb-3 flex items-center gap-3">
                <span
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center rounded-xl border text-indigo-600 transition dark:text-indigo-300',
                    isActive
                      ? 'border-indigo-400 bg-white shadow-md motion-safe:scale-105 dark:border-indigo-500/60 dark:bg-indigo-950/90'
                      : 'border-slate-200/90 bg-white/90 dark:border-slate-600 dark:bg-slate-800/80'
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {isActive && (
                    <span
                      className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-indigo-400/35 ring-offset-2 ring-offset-white motion-safe:animate-ping dark:ring-indigo-400/25 dark:ring-offset-slate-900"
                      aria-hidden
                    />
                  )}
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

      <div className="mt-8 flex justify-center gap-2" role="tablist" aria-label="How it works steps">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={active === i}
            aria-label={`Step ${i + 1}: ${s.title}`}
            onClick={() => setActive(i)}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              active === i ? 'w-8 bg-indigo-600 dark:bg-indigo-400' : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500'
            )}
          />
        ))}
      </div>
    </section>
  )
}
