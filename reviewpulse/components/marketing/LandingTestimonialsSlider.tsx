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

export default function LandingTestimonialsSlider({ items }: { items: LandingTestimonial[] }) {
  const scroller = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  const scrollTo = useCallback((i: number) => {
    const el = scroller.current
    if (!el) return
    const clamped = Math.max(0, Math.min(i, items.length - 1))
    const card = el.children[clamped] as HTMLElement | undefined
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    setIndex(clamped)
  }, [items.length])

  useEffect(() => {
    const el = scroller.current
    if (!el || items.length <= 1) return
    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      const mid = rect.left + rect.width / 2
      let best = 0
      let bestDist = Infinity
      for (let i = 0; i < el.children.length; i++) {
        const c = el.children[i] as HTMLElement
        const cr = c.getBoundingClientRect()
        const d = Math.abs(cr.left + cr.width / 2 - mid)
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      }
      setIndex(best)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [items.length])

  return (
    <div className="relative space-y-4">
      <div className="flex items-center justify-end gap-2 md:absolute md:right-0 md:top-0 md:z-10">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-9 shrink-0 rounded-full border-slate-200 bg-white/90 p-0 shadow-sm dark:border-slate-600 dark:bg-slate-800"
          aria-label="Previous testimonial"
          onClick={() => scrollTo(index - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-9 shrink-0 rounded-full border-slate-200 bg-white/90 p-0 shadow-sm dark:border-slate-600 dark:bg-slate-800"
          aria-label="Next testimonial"
          onClick={() => scrollTo(index + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-2 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <blockquote
            key={item.name}
            className={cn(
              'motion-safe:transition-transform min-w-[min(100%,22rem)] shrink-0 snap-center rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-sm duration-300 hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-lg dark:border-slate-700/90 dark:bg-slate-900/80 dark:hover:border-indigo-500/35 dark:hover:shadow-black/25 md:min-w-0 md:snap-align-none',
              index === i && 'ring-2 ring-indigo-500/25 dark:ring-indigo-400/30'
            )}
          >
            <div className="mb-3 flex items-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="mb-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">“{item.quote}”</p>
            <footer className="border-t border-slate-100 pt-4 dark:border-slate-700">
              <p className="font-semibold text-slate-900 dark:text-slate-50">{item.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.role}</p>
            </footer>
          </blockquote>
        ))}
      </div>

      <div className="flex justify-center gap-1.5 md:hidden">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to testimonial ${i + 1}`}
            aria-current={index === i}
            className={cn(
              'h-1.5 rounded-full transition-all',
              index === i ? 'w-6 bg-indigo-600 dark:bg-indigo-400' : 'w-1.5 bg-slate-300 dark:bg-slate-600'
            )}
            onClick={() => scrollTo(i)}
          />
        ))}
      </div>
    </div>
  )
}
