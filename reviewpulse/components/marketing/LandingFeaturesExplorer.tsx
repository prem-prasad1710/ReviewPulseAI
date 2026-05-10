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

function scrollChildIntoScroller(scroller: HTMLElement, child: HTMLElement) {
  const target =
    child.offsetLeft - (scroller.clientWidth - child.offsetWidth) / 2
  const max = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
  scroller.scrollTo({ left: Math.max(0, Math.min(target, max)), behavior: 'smooth' })
}

const AUTO_MS = 5500

export default function LandingFeaturesExplorer({ items }: { items: LandingFeatureItem[] }) {
  const [active, setActive] = useState(0)
  const scroller = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)

  const scrollTo = useCallback(
    (i: number) => {
      const root = scroller.current
      const clamped = Math.max(0, Math.min(i, items.length - 1))
      setActive(clamped)
      if (!root) return
      const child = root.children[clamped] as HTMLElement | undefined
      if (!child) return
      if (root.scrollWidth > root.clientWidth + 8) {
        scrollChildIntoScroller(root, child)
      }
    },
    [items.length]
  )

  useEffect(() => {
    const root = scroller.current
    if (!root) return

    const attach = () => {
      if (root.scrollWidth <= root.clientWidth + 8) return null
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

  useEffect(() => {
    if (items.length <= 1) return
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduce) return

    const t = window.setInterval(() => {
      if (pausedRef.current) return
      setActive((a) => {
        const next = (a + 1) % items.length
        const root = scroller.current
        const child = root?.children[next] as HTMLElement | undefined
        if (root && child && root.scrollWidth > root.clientWidth + 8) {
          scrollChildIntoScroller(root, child)
        }
        return next
      })
    }, AUTO_MS)
    return () => window.clearInterval(t)
  }, [items.length])

  const Icon = ICON_MAP[items[active]?.icon] ?? Globe2

  return (
    <div
      ref={rootRef}
      className="relative mx-auto max-w-6xl [perspective:1600px]"
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
        if (!rootRef.current?.contains(e.relatedTarget as Node)) pausedRef.current = false
      }}
    >
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-stretch md:gap-8">
        <div className="order-2 md:order-1 md:w-[42%] md:min-w-0">
          <div
            className={cn(
              'group relative overflow-hidden rounded-3xl border p-6 shadow-lg ring-1 transition-[box-shadow,transform] duration-500 md:duration-700',
              'border-indigo-200/90 bg-gradient-to-br from-white via-indigo-50/40 to-slate-50/95 shadow-indigo-500/10 ring-indigo-500/[0.07]',
              'dark:border-indigo-500/30 dark:from-indigo-950/55 dark:via-slate-900 dark:to-slate-950 dark:shadow-black/45 dark:ring-indigo-400/12',
              'motion-safe:md:[transform:rotateY(4deg)_translateZ(0)]',
              'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:p-px before:opacity-100 before:[background:linear-gradient(135deg,rgba(99,102,241,0.35),rgba(14,165,233,0.2),rgba(168,85,247,0.25))] before:[mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] before:[mask-composite:xor] before:[mask-clip:padding-box,border-box]',
              'dark:before:opacity-90'
            )}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-400/25 blur-3xl dark:bg-indigo-500/18" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl dark:bg-emerald-500/10" />
            <div className="relative flex items-start gap-3">
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ring-1 ring-white/25 transition-transform duration-300',
                  'bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-600/35',
                  'dark:from-indigo-500 dark:to-violet-600 dark:shadow-indigo-900/40 dark:ring-white/10',
                  'motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]'
                )}
              >
                <Icon className="h-6 w-6 motion-safe:transition-transform motion-safe:duration-500" aria-hidden />
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
            <div className="relative mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Feature spotlight">
              {items.map((f, i) => (
                <button
                  key={f.title}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  onClick={() => scrollTo(i)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                    i === active
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/25 dark:border-indigo-400 dark:bg-indigo-500 dark:shadow-indigo-950/40'
                      : 'border-slate-200/95 bg-white/90 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/80 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-indigo-500/50'
                  )}
                >
                  {i + 1}. {f.title.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="order-1 min-w-0 flex-1 md:order-2">
          <div className="mb-3 flex items-center justify-between md:mb-0 md:justify-end">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 md:hidden">
              Swipe features →
            </p>
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 shrink-0 rounded-full border-indigo-200/80 bg-white/95 p-0 shadow-sm hover:border-indigo-400 hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-indigo-400"
                aria-label="Previous feature"
                onClick={() => scrollTo(active - 1 < 0 ? items.length - 1 : active - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 shrink-0 rounded-full border-indigo-200/80 bg-white/95 p-0 shadow-sm hover:border-indigo-400 hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-indigo-400"
                aria-label="Next feature"
                onClick={() => scrollTo((active + 1) % items.length)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            ref={scroller}
            className="mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-visible pb-4 pt-1 [-webkit-overflow-scrolling:touch] motion-reduce:snap-none md:mt-5 md:grid md:grid-cols-2 md:gap-5 md:overflow-x-hidden md:overflow-y-visible md:pb-0 md:snap-none"
          >
            {items.map((feature, i) => {
              const Fi = ICON_MAP[feature.icon] ?? Globe2
              const isActive = i === active
              return (
                <article
                  key={feature.title}
                  data-index={i}
                  className={cn(
                    'snap-center shrink-0 scroll-m-4 rounded-2xl border bg-white/95 p-5 shadow-sm transition duration-300 dark:bg-slate-900/85',
                    'w-[min(100%,22rem)] cursor-pointer motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg',
                    'md:motion-safe:hover:[transform:rotateX(2deg)_rotateY(-4deg)]',
                    isActive
                      ? 'border-indigo-400/90 shadow-indigo-500/15 ring-2 ring-indigo-500/20 dark:border-indigo-500/55 dark:shadow-indigo-950/25 dark:ring-indigo-400/25'
                      : 'border-slate-200/90 hover:border-indigo-200/90 dark:border-slate-700/90 dark:hover:border-indigo-500/35'
                  )}
                  onClick={() => scrollTo(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      scrollTo(i)
                    }
                  }}
                  tabIndex={0}
                >
                  <div
                    className={cn(
                      'mb-3 inline-flex rounded-xl p-2.5 ring-1 transition-colors duration-300',
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-200 dark:ring-indigo-500/40'
                        : 'bg-indigo-50/90 text-indigo-600 ring-indigo-100/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-500/25'
                    )}
                  >
                    <Fi className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-50">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{feature.description}</p>
                  <p className="mt-3 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 md:hidden">
                    Tap to spotlight →
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
