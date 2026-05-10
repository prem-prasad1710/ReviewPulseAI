import { AlertTriangle, Clock3, MessageSquareText, Zap } from 'lucide-react'

export default function InsightRail({
  medianReplyHours,
  aiDraftsSaved,
  weeklyVolume,
  riskAlerts,
}: {
  medianReplyHours: number
  aiDraftsSaved: number
  weeklyVolume: number
  riskAlerts: number
}) {
  const items = [
    {
      label: 'Median first reply',
      value: `${medianReplyHours.toFixed(1)}h`,
      hint: 'Team SLA benchmark',
      icon: Clock3,
      accent: 'from-sky-500/10 to-blue-600/5 text-sky-700 dark:text-sky-300',
    },
    {
      label: 'AI drafts saved',
      value: aiDraftsSaved.toLocaleString('en-IN'),
      hint: 'Last 30 days',
      icon: MessageSquareText,
      accent: 'from-violet-500/10 to-indigo-600/5 text-violet-700 dark:text-violet-300',
    },
    {
      label: 'Replies published',
      value: weeklyVolume.toLocaleString('en-IN'),
      hint: 'This week',
      icon: Zap,
      accent: 'from-amber-500/10 to-orange-600/5 text-amber-800 dark:text-amber-300',
    },
    {
      label: 'Risk alerts',
      value: riskAlerts.toLocaleString('en-IN'),
      hint: '1★ & payment keywords',
      icon: AlertTriangle,
      accent: 'from-rose-500/10 to-red-600/5 text-rose-700 dark:text-rose-300',
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.label}
            className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60"
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-100 ${item.accent}`} aria-hidden />
            <div className="relative flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="mt-1 font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{item.value}</p>
                <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">{item.hint}</p>
              </div>
              <Icon className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
