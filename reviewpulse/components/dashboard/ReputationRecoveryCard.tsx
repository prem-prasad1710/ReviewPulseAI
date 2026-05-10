import Link from 'next/link'
import { HeartPulse, MessageCircleWarning } from 'lucide-react'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

export default function ReputationRecoveryCard({
  lowStarPending,
  recoveredCount,
}: {
  lowStarPending: number
  recoveredCount: number
}) {
  return (
    <Card className="border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-white p-5 dark:border-violet-500/25 dark:from-violet-950/40 dark:to-slate-900/80 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-violet-600/15 p-2 dark:bg-violet-500/20">
          <HeartPulse className="h-5 w-5 text-violet-700 dark:text-violet-300" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-50">Reputation recovery</CardTitle>
          <CardDescription className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Pipeline: low star → AI draft → you reply → we watch for rating updates.{' '}
            <span className="font-semibold text-violet-800 dark:text-violet-200">{recoveredCount}</span> recovered
            reviews tracked.
          </CardDescription>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="rounded-lg bg-white/80 px-2 py-1 dark:bg-slate-800/80">
              ≤2★ pending: <strong className="text-slate-900 dark:text-white">{lowStarPending}</strong>
            </span>
          </div>
          <Link
            href="/reviews"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
          >
            <MessageCircleWarning className="h-4 w-4" />
            Open reply queue
          </Link>
        </div>
      </div>
    </Card>
  )
}
