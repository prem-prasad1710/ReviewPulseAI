'use client'

import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react'
import {
  BarChart3,
  Bell,
  Bot,
  FileText,
  Languages,
  Link2,
  MapPin,
  MessageSquare,
  Radio,
  Send,
  Sparkles,
  Store,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type FlowSide = 'in' | 'out'

type FlowNode = {
  id: string
  label: string
  sub: string
  Icon: typeof MessageSquare
}

const NODES_IN: FlowNode[] = [
  { id: 'in-0', label: 'Google reviews', sub: 'Every location', Icon: MessageSquare },
  { id: 'in-1', label: 'Business Profile', sub: 'Hours & attributes', Icon: Store },
  { id: 'in-2', label: 'Sentiment & themes', sub: 'Auto-clustered', Icon: Sparkles },
  { id: 'in-3', label: 'Multi-outlet ops', sub: 'One login', Icon: MapPin },
  { id: 'in-4', label: 'Brand voice', sub: 'Tone you control', Icon: Radio },
]

const NODES_OUT: FlowNode[] = [
  { id: 'out-0', label: 'Published replies', sub: 'Google-native', Icon: Send },
  { id: 'out-1', label: 'Hindi · English', sub: 'Natural drafts', Icon: Languages },
  { id: 'out-2', label: 'Alerts & digests', sub: 'Email · WhatsApp', Icon: Bell },
  { id: 'out-3', label: 'Owner reports', sub: 'PDF in minutes', Icon: FileText },
  { id: 'out-4', label: 'Free reply tool', sub: 'No login preview', Icon: Link2 },
]

const PILL_LABELS_IN = ['Live sync', 'GBP data', 'Themes', 'All outlets', 'Voice lock'] as const
const PILL_LABELS_OUT = ['One-click', 'Bilingual', 'Real-time', 'Export', 'Shareable'] as const

type ElectricGeom = {
  w: number
  h: number
  dIn: string[]
  dOut: string[]
  pillIn: { x: number; y: number }[]
  pillOut: { x: number; y: number }[]
}

function localRect(el: DOMRect, mesh: DOMRect) {
  return {
    left: el.left - mesh.left,
    top: el.top - mesh.top,
    right: el.right - mesh.left,
    bottom: el.bottom - mesh.top,
  }
}

/** Smooth horizontal cubic: card edge → hub edge. */
function cubicBridge(sx: number, sy: number, ex: number, ey: number, tension = 0.48) {
  const dx = ex - sx
  const cx1 = sx + dx * tension
  const cy1 = sy
  const cx2 = ex - dx * tension
  const cy2 = ey
  const d = `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${ex} ${ey}`
  if (d.includes('NaN') || !Number.isFinite(dx)) return null
  return { d, cx1, cy1, cx2, cy2, x3: ex, y3: ey }
}

function isValidPathD(d: string) {
  return d.length > 8 && !d.includes('NaN') && !d.includes('Infinity')
}

function cubicMidpoint(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  t = 0.5
) {
  const mt = 1 - t
  const a = mt * mt * mt
  const b = 3 * mt * mt * t
  const c = 3 * mt * t * t
  const d = t * t * t
  return { x: a * x0 + b * x1 + c * x2 + d * x3, y: a * y0 + b * y1 + c * y2 + d * y3 }
}

function measureElectricMesh(mesh: HTMLElement): ElectricGeom | null {
  const w = mesh.clientWidth
  const h = mesh.clientHeight
  if (w < 64 || h < 64) return null

  const meshRect = mesh.getBoundingClientRect()
  const hubEl = mesh.querySelector<HTMLElement>('[data-electric-hub]')
  const leftEl = mesh.querySelector<HTMLElement>('[data-electric-col="in"]')
  const rightEl = mesh.querySelector<HTMLElement>('[data-electric-col="out"]')
  if (!hubEl || !leftEl || !rightEl) return null

  const hub = localRect(hubEl.getBoundingClientRect(), meshRect)
  const leftBtns = [...leftEl.querySelectorAll<HTMLButtonElement>('[data-electric-node]')]
  const rightBtns = [...rightEl.querySelectorAll<HTMLButtonElement>('[data-electric-node]')]
  if (leftBtns.length !== NODES_IN.length || rightBtns.length !== NODES_OUT.length) return null

  const inset = 6
  const n = NODES_IN.length
  const hubLeftX = hub.left + inset
  const hubRightX = hub.right - inset

  const hubPortY = (i: number) => {
    const span = Math.max(hub.bottom - hub.top - inset * 2, 1)
    return hub.top + inset + ((i + 0.5) / n) * span
  }

  const dIn: string[] = []
  const pillIn: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    const L = localRect(leftBtns[i]!.getBoundingClientRect(), meshRect)
    const sx = L.right - 1
    const sy = (L.top + L.bottom) / 2
    const ex = hubLeftX
    const ey = hubPortY(i)
    const bridge = cubicBridge(sx, sy, ex, ey)
    const d =
      bridge && isValidPathD(bridge.d) ? bridge.d : `M ${sx} ${sy} L ${ex} ${ey}`
    dIn.push(d)
    pillIn.push(
      bridge
        ? cubicMidpoint(sx, sy, bridge.cx1, bridge.cy1, bridge.cx2, bridge.cy2, bridge.x3, bridge.y3, 0.5)
        : { x: (sx + ex) / 2, y: (sy + ey) / 2 }
    )
  }

  const dOut: string[] = []
  const pillOut: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    const R = localRect(rightBtns[i]!.getBoundingClientRect(), meshRect)
    const sx = hubRightX
    const sy = hubPortY(i)
    const ex = R.left + 1
    const ey = (R.top + R.bottom) / 2
    const bridge = cubicBridge(sx, sy, ex, ey)
    const d =
      bridge && isValidPathD(bridge.d) ? bridge.d : `M ${sx} ${sy} L ${ex} ${ey}`
    dOut.push(d)
    pillOut.push(
      bridge
        ? cubicMidpoint(sx, sy, bridge.cx1, bridge.cy1, bridge.cx2, bridge.cy2, bridge.x3, bridge.y3, 0.5)
        : { x: (sx + ex) / 2, y: (sy + ey) / 2 }
    )
  }

  return { w, h, dIn, dOut, pillIn, pillOut }
}

function NodeButton({
  node,
  active,
  onHover,
  onLeave,
  align,
}: {
  node: FlowNode
  active: boolean
  onHover: () => void
  onLeave: () => void
  align: 'left' | 'right'
}) {
  const Icon = node.Icon
  return (
    <button
      type="button"
      data-electric-node={node.id}
      onMouseEnter={onHover}
      onFocus={onHover}
      onMouseLeave={onLeave}
      onBlur={onLeave}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-300',
        align === 'left' ? 'flex-row' : 'flex-row-reverse text-right',
        active
          ? 'border-cyan-500/45 bg-gradient-to-br from-cyan-50/90 to-indigo-50/80 shadow-[0_0_20px_-4px_rgba(6,182,212,0.25)] dark:border-cyan-400/50 dark:from-transparent dark:to-transparent dark:bg-white/12 dark:shadow-[0_0_24px_-4px_rgba(34,211,238,0.35)]'
          : 'border-slate-200/90 bg-white/90 hover:border-indigo-300/70 hover:bg-slate-50/95 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-indigo-400/35 dark:hover:bg-white/[0.08]'
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300',
          active
            ? 'border-cyan-500/40 bg-cyan-100 text-cyan-900 dark:border-cyan-300/60 dark:bg-cyan-500/20 dark:text-cyan-100'
            : 'border-slate-200 bg-slate-50 text-slate-600 group-hover:border-indigo-300 group-hover:text-indigo-800 dark:border-white/15 dark:bg-slate-900/60 dark:text-slate-300 dark:group-hover:border-indigo-400/40 dark:group-hover:text-white'
        )}
      >
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold leading-tight text-slate-900 dark:text-white">{node.label}</span>
        <span className="mt-0.5 block text-[11px] font-medium text-slate-600 dark:text-slate-400">{node.sub}</span>
      </span>
    </button>
  )
}

export default function LandingElectricFlow() {
  const rawId = useId().replace(/:/g, '')
  const gradId = `electric-grad-${rawId}`
  const meshRef = useRef<HTMLDivElement>(null)

  const [hoverIn, setHoverIn] = useState<number | null>(null)
  const [hoverOut, setHoverOut] = useState<number | null>(null)
  const [geom, setGeom] = useState<ElectricGeom | null>(null)

  const remesh = useCallback(() => {
    const el = meshRef.current
    if (!el) return
    setGeom(measureElectricMesh(el))
  }, [])

  useLayoutEffect(() => {
    const tick = () => remesh()
    tick()
    requestAnimationFrame(tick)

    const el = meshRef.current
    if (!el || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', remesh)
      return () => window.removeEventListener('resize', remesh)
    }
    const ro = new ResizeObserver(() => remesh())
    ro.observe(el)
    window.addEventListener('resize', remesh)

    const mql = window.matchMedia('(min-width: 1024px)')
    const onBp = () => requestAnimationFrame(remesh)
    mql.addEventListener('change', onBp)

    void document.fonts?.ready?.then(() => requestAnimationFrame(remesh))

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', remesh)
      mql.removeEventListener('change', onBp)
    }
  }, [remesh])

  useLayoutEffect(() => {
    remesh()
  }, [remesh, hoverIn, hoverOut])

  const pathClass = (side: FlowSide, index: number) => {
    const active = side === 'in' ? hoverIn === index : hoverOut === index
    const dimIn = side === 'in' && hoverIn !== null && hoverIn !== index
    const dimOut = side === 'out' && hoverOut !== null && hoverOut !== index
    return cn(
      'landing-electric-path',
      (dimIn || dimOut) && 'landing-electric-path-muted',
      active && 'landing-electric-path-active'
    )
  }

  return (
    <section
      id="electric-flow"
      className="relative mb-20 overflow-hidden rounded-[2rem] border border-slate-200/90 bg-gradient-to-b from-white via-slate-50/90 to-indigo-50/25 shadow-[0_40px_80px_-36px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.04] dark:border-slate-800/80 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 dark:shadow-[0_40px_100px_-40px_rgba(0,0,0,0.85)] dark:ring-white/[0.06]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5] dark:hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(100,116,139,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.14)_1px,transparent_1px)`,
          backgroundSize: '40px 40px',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          backgroundImage: `linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)`,
          backgroundSize: '40px 40px',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_0%,rgb(99,102,241,0.14),transparent_58%),radial-gradient(ellipse_55%_45%_at_100%_45%,rgb(6,182,212,0.08),transparent_52%),radial-gradient(ellipse_45%_38%_at_0%_85%,rgb(139,92,246,0.08),transparent_48%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgb(99,102,241,0.22),transparent_55%),radial-gradient(ellipse_60%_50%_at_100%_50%,rgb(6,182,212,0.12),transparent_50%),radial-gradient(ellipse_50%_40%_at_0%_80%,rgb(139,92,246,0.12),transparent_45%)]"
        aria-hidden
      />

      <div className="relative px-5 py-12 md:px-10 md:py-16 lg:px-12">
        <header className="mx-auto mb-10 max-w-3xl text-center lg:mb-12">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-600 dark:text-cyan-300/90">Dynamic product map</p>
          <h2 className="font-heading text-balance text-3xl font-bold leading-[1.12] tracking-tight text-slate-900 dark:text-white md:text-4xl lg:text-[2.65rem]">
            Connect every signal your customers leave — ship replies that feel human, fast
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-slate-600 dark:text-slate-400 md:text-base">
            Unlike generic “review widgets,” ReviewPulse is built for Google Business workflows in India: bilingual AI,
            approval before publish, and ops that scale from one salon to ten outlets without losing context.
          </p>
        </header>

        {/* Mobile: stacked flow */}
        <div className="mx-auto max-w-md space-y-8 lg:hidden">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500">Into the hub</p>
            <div className="space-y-2">
              {NODES_IN.map((n, i) => (
                <NodeButton
                  key={n.id}
                  node={n}
                  active={hoverIn === i}
                  onHover={() => setHoverIn(i)}
                  onLeave={() => setHoverIn(null)}
                  align="left"
                />
              ))}
            </div>
          </div>

          <HubCard />

          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500">Out to the market</p>
            <div className="space-y-2">
              {NODES_OUT.map((n, i) => (
                <NodeButton
                  key={n.id}
                  node={n}
                  active={hoverOut === i}
                  onHover={() => setHoverOut(i)}
                  onLeave={() => setHoverOut(null)}
                  align="right"
                />
              ))}
            </div>
          </div>
          <p className="text-center text-[11px] text-slate-500 dark:text-slate-500">On desktop, hover the nodes to trace each live path.</p>
        </div>

        {/* Desktop: SVG electric mesh — paths measured from real node + hub geometry */}
        <div
          ref={meshRef}
          className="relative mx-auto hidden min-h-[480px] max-w-6xl lg:block lg:min-h-[520px]"
        >
          <svg
            className="pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-visible"
            viewBox={geom ? `0 0 ${geom.w} ${geom.h}` : '0 0 1000 520'}
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="45%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
            {(geom?.dIn ?? []).map((d, i) => (
              <g key={`in-g-${i}`}>
                <path d={d} stroke="currentColor" className={cn(pathClass('in', i), 'text-indigo-300/25 dark:text-indigo-400/20')} strokeWidth={4} />
                <path d={d} stroke={`url(#${gradId})`} className={pathClass('in', i)} />
              </g>
            ))}
            {(geom?.dOut ?? []).map((d, i) => (
              <g key={`out-g-${i}`}>
                <path d={d} stroke="currentColor" className={cn(pathClass('out', i), 'text-indigo-300/25 dark:text-indigo-400/20')} strokeWidth={4} />
                <path d={d} stroke={`url(#${gradId})`} className={pathClass('out', i)} />
              </g>
            ))}
          </svg>

          {geom &&
            geom.pillIn.map((p, i) => (
              <span
                key={`pill-in-${i}`}
                className={cn(
                  'pointer-events-none absolute z-[1] max-w-[7rem] truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md transition-opacity duration-300',
                  hoverIn === i || hoverIn === null ? 'opacity-100' : 'opacity-25',
                  'border-cyan-600/25 bg-cyan-100/90 text-cyan-900 backdrop-blur-md dark:border-cyan-400/35 dark:bg-cyan-950/50 dark:text-cyan-100/95'
                )}
                style={{
                  left: `${(p.x / geom.w) * 100}%`,
                  top: `${(p.y / geom.h) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {PILL_LABELS_IN[i]}
              </span>
            ))}
          {geom &&
            geom.pillOut.map((p, i) => (
              <span
                key={`pill-out-${i}`}
                className={cn(
                  'pointer-events-none absolute z-[1] max-w-[7rem] truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md transition-opacity duration-300',
                  hoverOut === i || hoverOut === null ? 'opacity-100' : 'opacity-25',
                  'border-violet-500/25 bg-violet-100/90 text-violet-900 backdrop-blur-md dark:border-violet-400/35 dark:bg-violet-950/50 dark:text-violet-100/95'
                )}
                style={{
                  left: `${(p.x / geom.w) * 100}%`,
                  top: `${(p.y / geom.h) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {PILL_LABELS_OUT[i]}
              </span>
            ))}

          <div
            data-electric-col="in"
            className="absolute inset-y-8 left-0 z-[4] flex w-[11.5rem] flex-col justify-between py-2"
          >
            {NODES_IN.map((n, i) => (
              <NodeButton
                key={n.id}
                node={n}
                active={hoverIn === i}
                onHover={() => {
                  setHoverIn(i)
                  setHoverOut(null)
                }}
                onLeave={() => setHoverIn(null)}
                align="left"
              />
            ))}
          </div>

          <div data-electric-hub className="absolute left-1/2 top-1/2 z-[5] w-[min(100%,17.5rem)] -translate-x-1/2 -translate-y-1/2">
            <HubCard />
          </div>

          <div
            data-electric-col="out"
            className="absolute inset-y-8 right-0 z-[4] flex w-[11.5rem] flex-col justify-between py-2"
          >
            {NODES_OUT.map((n, i) => (
              <NodeButton
                key={n.id}
                node={n}
                active={hoverOut === i}
                onHover={() => {
                  setHoverOut(i)
                  setHoverIn(null)
                }}
                onLeave={() => setHoverOut(null)}
                align="right"
              />
            ))}
          </div>
        </div>

        <footer className="relative z-[4] mt-12 border-t border-slate-200/90 pt-8 dark:border-white/10 md:mt-14">
          <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">Built to sit beside tools you already use</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 opacity-90 grayscale transition hover:grayscale-0 hover:opacity-100 dark:opacity-80">
            {['Google Business', 'Gmail', 'Slack', 'WhatsApp', 'Razorpay', 'Resend'].map((name) => (
              <span key={name} className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                {name}
              </span>
            ))}
          </div>
        </footer>
      </div>
    </section>
  )
}

function HubCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-lg shadow-slate-900/[0.04] ring-1 ring-slate-900/[0.03] backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.06] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] dark:ring-transparent">
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/25" aria-hidden />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-cyan-400/15 blur-3xl dark:bg-cyan-500/20" aria-hidden />

      <div className="relative flex items-center justify-between gap-2 border-b border-slate-200/90 pb-3 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white dark:bg-indigo-500/30 dark:text-indigo-100">
            <Bot className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ReviewPulse hub</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Reply intelligence</p>
          </div>
        </div>
        <BarChart3 className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
      </div>

      <div className="relative mt-4 space-y-3 text-[11px]">
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/90 px-3 py-2 dark:border-white/10 dark:bg-slate-950/40">
          <p className="mb-1.5 font-semibold uppercase tracking-wide text-slate-500">Conditions</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-md bg-rose-100 px-2 py-0.5 font-medium text-rose-800 dark:bg-rose-500/20 dark:text-rose-100">Rating ≤ 3★</span>
            <span className="rounded-md bg-amber-100 px-2 py-0.5 font-medium text-amber-900 dark:bg-amber-500/15 dark:text-amber-100">Urgent</span>
            <span className="rounded-md bg-slate-200/80 px-2 py-0.5 font-medium text-slate-800 dark:bg-white/10 dark:text-slate-200">Last 30 days</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/90 px-3 py-2 dark:border-white/10 dark:bg-slate-950/40">
          <p className="mb-1.5 font-semibold uppercase tracking-wide text-slate-500">Output</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-md bg-cyan-100 px-2 py-0.5 font-medium text-cyan-900 dark:bg-cyan-500/20 dark:text-cyan-50">Draft reply</span>
            <span className="rounded-md bg-indigo-100 px-2 py-0.5 font-medium text-indigo-900 dark:bg-indigo-500/25 dark:text-indigo-100">Hindi / English</span>
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-medium text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100">Awaiting approve</span>
          </div>
        </div>
        <p className="text-center text-[10px] leading-relaxed text-slate-500 dark:text-slate-500">
          Nothing posts without you — we are not a faceless auto-poster.
        </p>
      </div>
    </div>
  )
}
