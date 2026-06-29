import Link from 'next/link'
import { AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

export type CrisisAlertItem = {
  id: string
  keyword: string
  locationName: string
  reviewId: string
  createdAt: Date
}

export default function CrisisRadarCard({ alerts }: { alerts: CrisisAlertItem[] }) {
  if (alerts.length === 0) return null

  return (
    <Card className="border-rose-200/90 bg-gradient-to-br from-rose-50/90 via-white to-orange-50/40 dark:border-rose-900/50 dark:from-rose-950/30 dark:via-slate-900 dark:to-orange-950/20">
      <div className="flex flex-wrap items-start justify-between gap-3 p-6 pb-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700 dark:text-rose-300">
            <ShieldAlert className="h-3.5 w-3.5" />
            Crisis radar
          </p>
          <CardTitle className="font-heading mt-1 text-lg dark:text-slate-50">
            {alerts.length} keyword alert{alerts.length === 1 ? '' : 's'} this month
          </CardTitle>
          <CardDescription className="mt-1 text-sm">
            Reviews mentioning hygiene, rude staff, or other crisis keywords — act before they spread.
          </CardDescription>
        </div>
        <Link href="/reviews?filter=crisis">
          <Button size="sm" variant="outline" className="rounded-xl border-rose-200 dark:border-rose-800">
            View inbox
          </Button>
        </Link>
      </div>

      <ul className="divide-y divide-rose-100 px-6 pb-5 dark:divide-rose-900/40">
        {alerts.slice(0, 5).map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  &ldquo;{a.keyword}&rdquo; at {a.locationName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(a.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </p>
              </div>
            </div>
            <Link
              href={`/reviews?review=${a.reviewId}&openReply=1`}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900 dark:text-rose-300 dark:hover:text-rose-100"
            >
              Reply
              <ArrowRight className="h-3 w-3" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
