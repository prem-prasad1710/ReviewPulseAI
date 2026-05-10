import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { PieChart } from 'lucide-react'

export default function WhyCustomersLeaveCard({
  buckets,
}: {
  buckets: { id: string; label: string; count: number }[]
}) {
  const top = buckets.slice(0, 5)
  if (top.length === 0) {
    return (
      <Card className="border-slate-200/90 p-5 dark:border-slate-700">
        <CardTitle className="text-base">Why customers leave</CardTitle>
        <CardDescription className="mt-1">Not enough recent negative text to cluster — keep syncing reviews.</CardDescription>
      </Card>
    )
  }

  return (
    <Card className="border-amber-200/80 bg-amber-50/40 p-5 dark:border-amber-700/40 dark:bg-amber-950/25 sm:p-6">
      <div className="flex items-start gap-3">
        <PieChart className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-50">Why customers leave</CardTitle>
          <CardDescription className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            Themes from recent low-star text (no extra AI cost).
          </CardDescription>
          <ul className="mt-3 space-y-2">
            {top.map((b) => (
              <li key={b.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-200">{b.label}</span>
                <span className="tabular-nums font-semibold text-amber-900 dark:text-amber-200">{b.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}
