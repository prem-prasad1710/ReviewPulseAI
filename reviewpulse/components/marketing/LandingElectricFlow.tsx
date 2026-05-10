'use client'

import { useId, useMemo, useState } from 'react'
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

const PILLS_IN: { label: string; left: string; top: string }[] = [
  { label: 'Live sync', left: '20%', top: '14%' },
  { label: 'GBP data', left: '24%', top: '30%' },
  { label: 'Themes', left: '22%', top: '46%' },
  { label: 'All outlets', left: '20%', top: '62%' },
  { label: 'Voice lock', left: '18%', top: '78%' },
]

const PILLS_OUT: { label: string; left: string; top: string }[] = [
  { label: 'One-click', left: '72%', top: '14%' },
  { label: 'Bilingual', left: '70%', top: '30%' },
  { label: 'Real-time', left: '74%', top: '46%' },
  { label: 'Export', left: '76%', top: '62%' },
  { label: 'Shareable', left: '78%', top: '78%' },
]

/** Cubic paths in viewBox 0 0 1000 520 — left column → hub, hub → right. */
function pathsIn(): string[] {
  const leftX = 88
  const hubX = 412
  const leftYs = [82, 158, 234, 310, 386]
  const hubYs = [218, 238, 258, 278, 298]
  return leftYs.map((y0, i) => {
    const y1 = hubYs[i] ?? 258
    const c1x = 260
    const c2x = 340
    return `M ${leftX} ${y0} C ${c1x} ${y0}, ${c2x} ${y1}, ${hubX} ${y1}`
  })
}

function pathsOut(): string[] {
  const hubX = 588
  const rightX = 912
  const hubYs = [218, 238, 258, 278, 298]
  const rightYs = [82, 158, 234, 310, 386]
  return hubYs.map((y0, i) => {
    const y1 = rightYs[i] ?? 310
    const c1x = 700
    const c2x = 820
    return `M ${hubX} ${y0} C ${c1x} ${y0}, ${c2x} ${y1}, ${rightX} ${y1}`
  })
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
      onMouseEnter={onHover}
      onFocus={onHover}
      onMouseLeave={onLeave}
      onBlur={onLeave}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-300',
        align === 'left' ? 'flex-row' : 'flex-row-reverse text-right',
        active
          ? 'border-cyan-400/50 bg-white/12 shadow-[0_0_24px_-4px_rgba(34,211,238,0.35)]'
          : 'border-white/10 bg-white/[0.04] hover:border-indigo-400/35 hover:bg-white/[0.08]'
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300',
          active
            ? 'border-cyan-300/60 bg-cyan-500/20 text-cyan-100'
            : 'border-white/15 bg-slate-900/60 text-slate-300 group-hover:border-indigo-400/40 group-hover:text-white'
        )}
      >
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold leading-tight text-white">{node.label}</span>
        <span className="mt-0.5 block text-[11px] font-medium text-slate-400">{node.sub}</span>
      </span>
    </button>
  )
}

export default function LandingElectricFlow() {
  const rawId = useId().replace(/:/g, '')
  const gradId = `electric-grad-${rawId}`

  const [hoverIn, setHoverIn] = useState<number | null>(null)
  const [hoverOut, setHoverOut] = useState<number | null>(null)

  const dIn = useMemo(() => pathsIn(), [])
  const dOut = useMemo(() => pathsOut(), [])

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
      className="relative mb-20 overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-950 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.06]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: `linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)`,
          backgroundSize: '40px 40px',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgb(99,102,241,0.22),transparent_55%),radial-gradient(ellipse_60%_50%_at_100%_50%,rgb(6,182,212,0.12),transparent_50%),radial-gradient(ellipse_50%_40%_at_0%_80%,rgb(139,92,246,0.12),transparent_45%)]"
        aria-hidden
      />

      <div className="relative px-5 py-12 md:px-10 md:py-16 lg:px-12">
        <header className="mx-auto mb-10 max-w-3xl text-center lg:mb-12">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300/90">Dynamic product map</p>
          <h2 className="font-heading text-balance text-3xl font-bold leading-[1.12] tracking-tight text-white md:text-4xl lg:text-[2.65rem]">
            Connect every signal your customers leave — ship replies that feel human, fast
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-slate-400 md:text-base">
            Unlike generic “review widgets,” ReviewPulse is built for Google Business workflows in India: bilingual AI,
            approval before publish, and ops that scale from one salon to ten outlets without losing context.
          </p>
        </header>

        {/* Mobile: stacked flow */}
        <div className="mx-auto max-w-md space-y-8 lg:hidden">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Into the hub</p>
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Out to the market</p>
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
          <p className="text-center text-[11px] text-slate-500">On desktop, hover the nodes to trace each live path.</p>
        </div>

        {/* Desktop: SVG electric mesh */}
        <div className="relative mx-auto hidden min-h-[480px] max-w-6xl lg:block lg:min-h-[520px]">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1000 520"
            preserveAspectRatio="xMidYMid meet"
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
            {dIn.map((d, i) => (
              <path
                key={`in-${i}`}
                d={d}
                stroke={`url(#${gradId})`}
                className={pathClass('in', i)}
              />
            ))}
            {dOut.map((d, i) => (
              <path
                key={`out-${i}`}
                d={d}
                stroke={`url(#${gradId})`}
                className={pathClass('out', i)}
              />
            ))}
          </svg>

          {PILLS_IN.map((p, i) => (
            <span
              key={`pill-in-${i}`}
              className={cn(
                'pointer-events-none absolute z-[1] max-w-[7rem] truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md transition-opacity duration-300',
                hoverIn === i || hoverIn === null ? 'opacity-100' : 'opacity-25',
                'border-cyan-400/35 bg-cyan-950/50 text-cyan-100/95'
              )}
              style={{ left: p.left, top: p.top, transform: 'translate(-50%, -50%)' }}
            >
              {p.label}
            </span>
          ))}
          {PILLS_OUT.map((p, i) => (
            <span
              key={`pill-out-${i}`}
              className={cn(
                'pointer-events-none absolute z-[1] max-w-[7rem] truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md transition-opacity duration-300',
                hoverOut === i || hoverOut === null ? 'opacity-100' : 'opacity-25',
                'border-violet-400/35 bg-violet-950/50 text-violet-100/95'
              )}
              style={{ left: p.left, top: p.top, transform: 'translate(-50%, -50%)' }}
            >
              {p.label}
            </span>
          ))}

          <div className="absolute inset-y-8 left-0 z-[2] flex w-[11.5rem] flex-col justify-between py-2">
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

          <div className="absolute left-1/2 top-1/2 z-[3] w-[min(100%,17.5rem)] -translate-x-1/2 -translate-y-1/2">
            <HubCard />
          </div>

          <div className="absolute inset-y-8 right-0 z-[2] flex w-[11.5rem] flex-col justify-between py-2">
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

        <footer className="relative z-[4] mt-12 border-t border-white/10 pt-8 md:mt-14">
          <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Built to sit beside tools you already use</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 opacity-80 grayscale transition hover:grayscale-0 hover:opacity-100">
            {['Google Business', 'Gmail', 'Slack', 'WhatsApp', 'Razorpay', 'Resend'].map((name) => (
              <span key={name} className="text-xs font-semibold tracking-wide text-slate-400">
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
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-500/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-cyan-500/20 blur-3xl" aria-hidden />

      <div className="relative flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/30 text-indigo-100">
            <Bot className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ReviewPulse hub</p>
            <p className="text-sm font-semibold text-white">Reply intelligence</p>
          </div>
        </div>
        <BarChart3 className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
      </div>

      <div className="relative mt-4 space-y-3 text-[11px]">
        <div className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
          <p className="mb-1.5 font-semibold uppercase tracking-wide text-slate-500">Conditions</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-md bg-rose-500/20 px-2 py-0.5 font-medium text-rose-100">Rating ≤ 3★</span>
            <span className="rounded-md bg-amber-500/15 px-2 py-0.5 font-medium text-amber-100">Urgent</span>
            <span className="rounded-md bg-white/10 px-2 py-0.5 font-medium text-slate-200">Last 30 days</span>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
          <p className="mb-1.5 font-semibold uppercase tracking-wide text-slate-500">Output</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 font-medium text-cyan-50">Draft reply</span>
            <span className="rounded-md bg-indigo-500/25 px-2 py-0.5 font-medium text-indigo-100">Hindi / English</span>
            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 font-medium text-emerald-100">Awaiting approve</span>
          </div>
        </div>
        <p className="text-center text-[10px] leading-relaxed text-slate-500">
          Nothing posts without you — we are not a faceless auto-poster.
        </p>
      </div>
    </div>
  )
}
