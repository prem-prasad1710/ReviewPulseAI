import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { cn, formatCurrencyINR } from '@/lib/utils'
import { AlertCircle, IndianRupee, MessageSquareReply, QrCode, Radio, Star } from 'lucide-react'

export default function StatsCards({
  totalReviews,
  averageRating,
  pendingReplies,
  repliedThisMonth,
  qrScansTotal,
  bridgeVisitsTotal,
}: {
  totalReviews: number
  averageRating: number
  pendingReplies: number
  repliedThisMonth: number
  qrScansTotal?: number
  /** Offline bridge landing page visits (sum across locations). */
  bridgeVisitsTotal?: number
}) {
  const stats = [
    {
      label: 'Total reviews',
      value: totalReviews.toLocaleString('en-IN'),
      helper: 'Across connected locations',
      icon: MessageSquareReply,
      accent: 'from-blue-500/15 to-blue-600/5',
      iconClass:
        'text-blue-600 bg-blue-50 ring-blue-100 dark:text-blue-300 dark:bg-blue-950/50 dark:ring-blue-800/80',
    },
    {
      label: 'Average rating',
      value: `${averageRating.toFixed(1)} / 5`,
      helper: averageRating >= 4 ? 'Strong social proof' : 'Room to improve—watch trends weekly',
      icon: Star,
      accent: 'from-amber-500/15 to-amber-600/5',
      iconClass:
        'text-amber-600 bg-amber-50 ring-amber-100 dark:text-amber-300 dark:bg-amber-950/45 dark:ring-amber-800/80',
    },
    {
      label: 'Pending replies',
      value: pendingReplies.toLocaleString('en-IN'),
      helper: pendingReplies > 0 ? 'Prioritize before response rate slips' : 'Inbox is clear',
      icon: AlertCircle,
      accent: 'from-rose-500/15 to-rose-600/5',
      iconClass:
        'text-rose-600 bg-rose-50 ring-rose-100 dark:text-rose-300 dark:bg-rose-950/45 dark:ring-rose-800/80',
    },
    {
      label: 'Revenue signal',
      value: formatCurrencyINR(repliedThisMonth * 999),
      helper: 'Illustrative value from engaged customers',
      icon: IndianRupee,
      accent: 'from-emerald-500/15 to-emerald-600/5',
      iconClass:
        'text-emerald-600 bg-emerald-50 ring-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/45 dark:ring-emerald-800/80',
    },
    ...(typeof qrScansTotal === 'number'
      ? [
          {
            label: 'QR review scans',
            value: qrScansTotal.toLocaleString('en-IN'),
            helper: 'Smart QR /r redirects to Google reviews',
            icon: QrCode,
            accent: 'from-violet-500/15 to-violet-600/5',
            iconClass:
              'text-violet-600 bg-violet-50 ring-violet-100 dark:text-violet-300 dark:bg-violet-950/45 dark:ring-violet-800/80',
          },
        ]
      : []),
    ...(typeof bridgeVisitsTotal === 'number'
      ? [
          {
            label: 'Bridge visits',
            value: bridgeVisitsTotal.toLocaleString('en-IN'),
            helper: 'NFC / QR “visit” starter page opens',
            icon: Radio,
            accent: 'from-cyan-500/15 to-cyan-600/5',
            iconClass:
              'text-cyan-700 bg-cyan-50 ring-cyan-100 dark:text-cyan-200 dark:bg-cyan-950/45 dark:ring-cyan-800/80',
          },
        ]
      : []),
  ]

  return (
    <div
      className={`grid gap-4 sm:grid-cols-2 ${
        stats.length > 5 ? 'xl:grid-cols-6' : stats.length > 4 ? 'xl:grid-cols-5' : 'xl:grid-cols-4'
      }`}
    >
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <Card
            key={stat.label}
            style={{ animationDelay: `${i * 45}ms` }}
            className={cn(
              'animate-fade-up relative overflow-hidden rounded-2xl border-slate-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-lg dark:border-slate-700/80 dark:hover:border-indigo-500/30 dark:hover:shadow-black/20'
            )}
          >
            <div
              className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90', stat.accent)}
              aria-hidden
            />
            <div className="relative flex items-start justify-between gap-3 p-5">
              <div className="min-w-0">
                <CardDescription className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {stat.label}
                </CardDescription>
                <CardTitle className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{stat.value}</CardTitle>
              </div>
              <span className={cn('rounded-xl p-2.5 ring-1 ring-inset', stat.iconClass)}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="relative px-5 pb-5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{stat.helper}</p>
          </Card>
        )
      })}
    </div>
  )
}
