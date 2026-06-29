'use client'

import Link from 'next/link'
import { ArrowRight, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingFinalCta() {
  return (
    <section className="landing-cta-glow relative overflow-hidden rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 via-white to-emerald-50/80 p-10 text-center shadow-lg shadow-indigo-900/5 dark:border-indigo-500/25 dark:from-indigo-950/50 dark:via-slate-900 dark:to-emerald-950/30 dark:shadow-black/30 md:p-12">
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl motion-safe:animate-float-soft dark:bg-indigo-500/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl motion-safe:animate-float-soft dark:bg-emerald-500/10"
        style={{ animationDelay: '1.2s' }}
        aria-hidden
      />

      <div className="relative">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-indigo-800 shadow-sm dark:border-slate-600/80 dark:bg-slate-800/90 dark:text-indigo-200">
          <BadgeCheck className="h-3.5 w-3.5" />
          No card required to start
        </p>
        <h3 className="font-heading mb-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
          Turn every review into repeat business
        </h3>
        <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 md:text-base">
          Launch ReviewPulse and give every customer a fast, thoughtful response that protects your reputation and compounds trust over time.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/login">
            <Button
              size="lg"
              className="landing-cta-primary gap-2 rounded-xl shadow-lg shadow-indigo-600/25 transition hover:shadow-xl hover:shadow-indigo-600/30 active:scale-[0.98]"
            >
              Start 14-day trial
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/tools/free-reply">
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl border-slate-200 bg-white/90 transition hover:bg-white active:scale-[0.98] dark:border-slate-600 dark:bg-slate-800/80 dark:hover:bg-slate-800"
            >
              Try free AI reply
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
