'use client'

import { useCallback, useRef, useState } from 'react'
import { Star } from 'lucide-react'

/** Interactive 3D-tilt hero preview (pointer / touch). Respects `prefers-reduced-motion`. */
export default function LandingHero3D() {
  const wrap = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, s: 1 })

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = wrap.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    setTilt({ rx: py * -10, ry: px * 12, s: 1.01 })
  }, [])

  const onPointerLeave = useCallback(() => {
    setTilt({ rx: 0, ry: 0, s: 1 })
  }, [])

  return (
    <div
      ref={wrap}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="[perspective:1100px] motion-reduce:[perspective:none]"
    >
      <div
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale3d(${tilt.s},${tilt.s},${tilt.s})`,
        }}
        className="motion-reduce:transform-none rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-2xl shadow-indigo-900/10 ring-1 ring-slate-900/[0.04] transition-[transform,box-shadow] duration-200 ease-out [transform-style:preserve-3d] will-change-transform dark:border-slate-700/90 dark:bg-slate-900/90 dark:shadow-black/40 dark:ring-white/[0.06] md:p-7"
      >
        <div className="mb-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Total reviews', value: '1,274', tone: 'text-slate-900 dark:text-slate-100' },
            { label: 'Avg rating', value: '4.6', tone: 'text-slate-900 dark:text-slate-100' },
            { label: 'Unanswered', value: '217', tone: 'text-rose-600 dark:text-rose-400' },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-3 transition hover:border-indigo-100 hover:shadow-sm dark:border-slate-600/80 dark:from-slate-800/90 dark:to-slate-900/90 dark:hover:border-indigo-500/35"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{m.label}</p>
              <p className={`mt-1 text-xl font-bold tabular-nums ${m.tone}`}>{m.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-600/70 dark:bg-slate-800/50 [transform:translateZ(24px)]">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Latest review</p>
            <div className="flex items-center gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            Amazing food and super quick service. Paneer tikka was outstanding.
          </p>
          <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50/80 p-3 text-sm leading-relaxed text-indigo-950 dark:border-indigo-500/30 dark:from-indigo-950/70 dark:to-blue-950/50 dark:text-indigo-100">
            Thank you for your kind words—we are thrilled you enjoyed our paneer tikka and service. We look forward to
            welcoming you again soon.
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 motion-reduce:hidden">
          Drag / move pointer over this card — 3D preview
        </p>
      </div>
    </div>
  )
}
