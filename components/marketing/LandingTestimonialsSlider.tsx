'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type LandingTestimonial = {
  quote: string
  name: string
  role: string
}

function scrollChildIntoScroller(scroller: HTMLElement, child: HTMLElement) {
  const target =
    child.offsetLeft - (scroller.clientWidth - child.offsetWidth) / 2
  const max = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
  scroller.scrollTo({ left: Math.max(0, Math.min(target, max)), behavior: 'smooth' })
}

const AUTO_MS = 6000

export default function LandingTestimonialsSlider({ items }: { items: LandingTestimonial[] }) {
  const scroller = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const pausedRef = useRef(false)

  const scrollTo = useCallback(
    (i: number) => {
      const el = scroller.current
      if (!el) return
      const len = items.length
      if (len === 0) return
      const clamped = ((i % len) + len) % len
      const card = el.children[clamped] as HTMLElement | undefined
      setIndex(clamped)
      if (card) scrollChildIntoScroller(el, card)
    },
    [items.length]
  )

  useEffect(() => {
    const el = scroller.current
    if (!el || items.length <= 1) return

    const onScroll = () => {
      const mid = el.scrollLeft + el.clientWidth / 2
      let best = 0
      let bestDist = Infinity
      for (let i = 0; i < el.children.length; i++) {
        const c = el.children[i] as HTMLElement
        const center = c.offsetLeft + c.offsetWidth / 2
        const d = Math.abs(center - mid)
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      }
      setIndex(best)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [items.length])

  useEffect(() => {
    if (items.length <= 1) return
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const t = window.setInterval(() => {
      if (pausedRef.current) return
      setIndex((prev) => {
        const next = (prev + 1) % items.length
        const el = scroller.current
        const card = el?.children[next] as HTMLElement | undefined
        if (el && card) scrollChildIntoScroller(el, card)
        return next
      })
    }, AUTO_MS)
    return () => window.clearInterval(t)
  }, [items.length])

  return (
    <div
      ref={rootRef}
      className="relative space-y-5"
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
      <div className="flex items-center justify-end gap-2 md:absolute md:right-0 md:top-0 md:z-20">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-9 shrink-0 rounded-full border-indigo-200/90 bg-white/95 p-0 shadow-sm hover:border-indigo-400 hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-indigo-400"
          aria-label="Previous testimonial"
          onClick={() => scrollTo(index - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-9 shrink-0 rounded-full border-indigo-200/90 bg-white/95 p-0 shadow-sm hover:border-indigo-400 hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-indigo-400"
          aria-label="Next testimonial"
          onClick={() => scrollTo(index + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative md:pt-2">
        <div
          ref={scroller}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-5 md:px-1 [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, i) => (
            <blockquote
              key={item.name}
              className={cn(
                'motion-safe:transition-[transform,box-shadow,border-color] min-w-[min(100%,20rem)] shrink-0 snap-center rounded-2xl border bg-white/95 p-6 shadow-sm duration-300 sm:min-w-[min(100%,24rem)] md:min-w-[min(calc(50%-0.625rem),22rem)]',
                'hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg dark:bg-slate-900/85 dark:hover:border-indigo-500/40 dark:hover:shadow-black/30',
                index === i
                  ? 'border-indigo-300/90 ring-2 ring-indigo-500/20 dark:border-indigo-500/45 dark:ring-indigo-400/25'
                  : 'border-slate-200/90 dark:border-slate-700/90'
              )}
            >
              <div className="mb-3 flex items-center gap-1 text-amber-500 dark:text-amber-400">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mb-4 text-sm leading-relaxed text-slate-800 dark:text-slate-300">“{item.quote}”</p>
              <footer className="border-t border-slate-100 pt-4 dark:border-slate-700">
                <p className="font-semibold text-slate-900 dark:text-slate-50">{item.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to testimonial ${i + 1}`}
            aria-current={index === i ? 'true' : undefined}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              index === i ? 'w-6 bg-indigo-600 dark:bg-indigo-400' : 'w-1.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600'
            )}
            onClick={() => scrollTo(i)}
          />
        ))}
      </div>
    </div>
  )
}
