'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bot, ChevronLeft, ChevronRight, Globe2, MessageCircleReply, TrendingUp, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ICON_MAP = {
  Globe2,
  Bot,
  MessageCircleReply,
  TrendingUp,
} as const satisfies Record<string, LucideIcon>

export type LandingFeatureItem = {
  title: string
  description: string
  icon: keyof typeof ICON_MAP
}

export default function LandingFeaturesExplorer({ items }: { items: LandingFeatureItem[] }) {
  const [active, setActive] = useState(0)
  const scroller = useRef<HTMLDivElement>(null)

  const scrollTo = useCallback((i: number) => {
    const el = scroller.current?.children[i] as HTMLElement | undefined
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    setActive(i)
  }, [])

  useEffect(() => {
    const root = scroller.current
    if (!root) return

    const attach = () => {
      if (root.scrollWidth <= root.clientWidth + 4) return null
      const obs = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue
            const idx = Number((e.target as HTMLElement).dataset.index)
            if (!Number.isNaN(idx)) setActive(idx)
          }
        },
        { root, threshold: 0.55 }
      )
      Array.from(root.children).forEach((c) => obs.observe(c))
      return () => obs.disconnect()
    }

    let detach: (() => void) | null | undefined
    const run = () => {
      detach?.()
      detach = attach() ?? undefined
    }
    run()
    const ro = new ResizeObserver(() => run())
    ro.observe(root)
    return () => {
      detach?.()
      ro.disconnect()
    }
  }, [items.length])

  const Icon = ICON_MAP[items[active]?.icon] ?? Globe2

  return (
    <div className="relative mx-auto max-w-6xl [perspective:1600px]">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-stretch md:gap-8">
        {/* Sticky detail panel — 3D depth */}
        <div className="order-2 md:order-1 md:w-[42%] md:min-w-0">
          <div
            className={cn(
              'relative overflow-hidden rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/95 via-white to-slate-50/90 p-6 shadow-[0_24px_60px_-28px_rgba(79,70,229,0.35)] ring-1 ring-indigo-500/10 transition-transform duration-500 dark:border-indigo-500/25 dark:from-indigo-950/60 dark:via-slate-900 dark:to-slate-950 dark:shadow-black/40 dark:ring-indigo-400/15',
              'motion-safe:md:[transform:rotateY(4deg)_translateZ(0)]'
            )}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/15" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-500/10" />
            <div className="relative flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20 dark:ring-white/10">
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Spotlight</p>
                <h3 className="font-heading mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-2xl">
                  {items[active]?.title}
                </h3>
              </div>
            </div>
            <p className="relative mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
              {items[active]?.description}
            </p>
            <div className="relative mt-5 flex flex-wrap gap-2">
              {items.map((f, i) => (
                <button
                  key={f.title}
                  type="button"
                  onClick={() => scrollTo(i)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition',
                    i === active
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-md dark:border-indigo-400 dark:bg-indigo-500'
                      : 'border-slate-200/90 bg-white/80 text-slate-600 hover:border-indigo-200 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300'
                  )}
                >
                  {i + 1}. {f.title.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Horizontal scroll deck — mobile-first, always scrollable */}
        <div className="order-1 min-w-0 flex-1 md:order-2">
          <div className="mb-3 flex items-center justify-between md:hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Swipe features →</p>
            <div className="flex gap-1">
              <Button type="button" variant="outline" size="sm" className="h-8 w-8 shrink-0 rounded-full p-0" onClick={() => scrollTo(Math.max(0, active - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 shrink-0 rounded-full p-0"
                onClick={() => scrollTo(Math.min(items.length - 1, active + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            ref={scroller}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-visible pb-4 pt-1 [-webkit-overflow-scrolling:touch] motion-reduce:snap-none md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:pb-0"
          >
            {items.map((feature, i) => {
              const Fi = ICON_MAP[feature.icon] ?? Globe2
              return (
                <article
                  key={feature.title}
                  data-index={i}
                  className={cn(
                    'snap-center shrink-0 scroll-m-4 rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-sm transition duration-300 dark:border-slate-700/90 dark:bg-slate-900/85',
                    'w-[min(100%,22rem)] motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-xl motion-safe:hover:shadow-indigo-900/10',
                    'md:transition-transform md:duration-300 md:motion-safe:hover:[transform:rotateX(3deg)_rotateY(-5deg)]'
                  )}
                >
                  <div className="mb-3 inline-flex rounded-xl bg-indigo-50 p-2.5 text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-500/30">
                    <Fi className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-50">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{feature.description}</p>
                  <button
                    type="button"
                    className="mt-3 text-xs font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300 md:hidden"
                    onClick={() => setActive(i)}
                  >
                    Show in spotlight
                  </button>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
