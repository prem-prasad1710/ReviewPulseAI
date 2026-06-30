import Link from 'next/link'
import { TrendingDown, TrendingUp, Zap } from 'lucide-react'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import type { SpikeKind } from '@/lib/review-velocity-spike'

export type SpikeData = {
  locationId: string
  locationName: string
  kind: SpikeKind
  reviewCount: number
  windowHours: number
  avgRating: number
}

const config: Record<
  SpikeKind,
  { icon: React.ElementType; title: string; color: string; barColor: string; cta: string }
> = {
  negative_attack: {
    icon: TrendingDown,
    title: 'Negative review spike',
    color: 'border-rose-200/90 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/25',
    barColor: 'bg-rose-500',
    cta: 'Reply now',
  },
  positive_surge: {
    icon: TrendingUp,
    title: 'Positive review surge',
    color: 'border-emerald-200/90 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/25',
    barColor: 'bg-emerald-500',
    cta: 'Share the win',
  },
  volume_spike: {
    icon: Zap,
    title: 'Unusual review activity',
    color: 'border-amber-200/90 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/25',
    barColor: 'bg-amber-500',
    cta: 'Check inbox',
  },
}

export default function VelocitySpikeCard({ spikes }: { spikes: SpikeData[] }) {
  if (spikes.length === 0) return null

  return (
    <Card className="overflow-hidden border-slate-200/90 dark:border-slate-700/80">
      <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
          Velocity radar
        </p>
        <CardTitle className="font-heading mt-0.5 text-lg dark:text-slate-50">
          Unusual review activity detected
        </CardTitle>
        <CardDescription className="mt-1 text-sm">
          Real-time spikes in review volume — act before they affect ranking or reputation.
        </CardDescription>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {spikes.map((spike) => {
          const { icon: Icon, title, color, cta } = config[spike.kind]
          return (
            <div key={`${spike.locationId}-${spike.kind}`} className={`flex flex-wrap items-start justify-between gap-3 px-6 py-4 ${color}`}>
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
                  <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">
                    <strong>{spike.reviewCount}</strong> new {spike.kind === 'negative_attack' ? '≤2★' : spike.kind === 'positive_surge' ? '≥4★' : ''}{' '}
                    reviews in {spike.windowHours}h at <strong>{spike.locationName}</strong>
                    {spike.kind !== 'positive_surge' ? ` · avg ${spike.avgRating}★` : ''}
                  </p>
                </div>
              </div>
              <Link
                href={`/reviews?locationId=${spike.locationId}`}
                className="inline-flex h-8 shrink-0 items-center rounded-xl border border-current/20 bg-white/70 px-3 text-xs font-semibold text-slate-800 transition hover:bg-white dark:bg-slate-900/60 dark:text-slate-100"
              >
                {cta}
              </Link>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
