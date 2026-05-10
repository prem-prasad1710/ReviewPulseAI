'use client'

import { cn } from '@/lib/utils'

export default function LandingLogoMarquee({ logos }: { logos: readonly string[] }) {
  const doubled = [...logos, ...logos]

  return (
    <div className="landing-marquee-wrap relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/60 py-4 shadow-inner dark:border-slate-700/80 dark:bg-slate-900/50">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white/95 to-transparent dark:from-slate-950/90" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white/95 to-transparent dark:from-slate-950/90" />
      <div className="flex w-max animate-landing-marquee gap-4 pr-4 will-change-transform">
        {doubled.map((logo, i) => (
          <span
            key={`${logo}-${i}`}
            className={cn(
              'inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white/95 px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-slate-900 hover:shadow-md dark:border-slate-600/90 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:text-white'
            )}
          >
            {logo}
          </span>
        ))}
      </div>
    </div>
  )
}
