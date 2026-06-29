'use client'

import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type LandingPlan = {
  planKey: 'starter' | 'growth' | 'scale'
  name: string
  price: string
  subtitle: string
  points: string[]
  highlighted: boolean
}

export default function LandingPricingShowcase({ plans }: { plans: LandingPlan[] }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [spot, setSpot] = useState({ x: 50, y: 40 })

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrap.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    setSpot({ x, y })
  }, [])

  const onLeave = useCallback(() => setSpot({ x: 50, y: 35 }), [])

  return (
    <div
      ref={wrap}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative grid gap-5 lg:grid-cols-3"
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-[1.35rem] opacity-70 blur-2xl transition-opacity duration-500 dark:opacity-50"
        style={{
          background: `radial-gradient(42% 48% at ${spot.x}% ${spot.y}%, rgba(99, 102, 241, 0.28), transparent 72%), radial-gradient(36% 40% at ${100 - spot.x * 0.6}% ${spot.y * 0.9}%, rgba(16, 185, 129, 0.12), transparent 70%)`,
        }}
        aria-hidden
      />

      {plans.map((plan) => (
        <article
          key={plan.name}
          className={cn(
            'motion-safe:animate-fade-up relative flex flex-col rounded-2xl border p-6 transition duration-300 will-change-transform hover:-translate-y-1 hover:shadow-xl',
            plan.highlighted
              ? 'border-indigo-500 bg-gradient-to-b from-indigo-50/95 to-white shadow-xl shadow-indigo-900/10 ring-1 ring-indigo-500/20 dark:border-indigo-400 dark:from-indigo-950/70 dark:to-slate-900/90 dark:shadow-indigo-950/30 dark:ring-indigo-400/25'
              : 'border-slate-200/90 bg-white/95 hover:border-indigo-200 hover:shadow-lg dark:border-slate-700/90 dark:bg-slate-900/80 dark:hover:border-indigo-500/40 dark:hover:shadow-black/25'
          )}
        >
          {plan.highlighted ? (
            <span className="mb-3 w-fit rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">Most popular</span>
          ) : (
            <span className="mb-3 h-7" aria-hidden />
          )}
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">{plan.name}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{plan.subtitle}</p>
          <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {plan.price}
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/mo</span>
          </p>

          <ul className="mt-5 flex-1 space-y-2.5">
            {plan.points.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-2">
            <Link href={`/subscribe?plan=${plan.planKey}`} className="block">
              <Button variant={plan.highlighted ? 'default' : 'outline'} className="w-full rounded-xl transition active:scale-[0.99]">
                Subscribe — {plan.name}
              </Button>
            </Link>
            <p className="text-center text-[10px] leading-snug text-slate-500 dark:text-slate-400">
              14-day Growth trial on signup · Secured by Razorpay · Sign in required
            </p>
          </div>
        </article>
      ))}
    </div>
  )
}
