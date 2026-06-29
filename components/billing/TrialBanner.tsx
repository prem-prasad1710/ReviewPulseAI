import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { isTrialActive, trialDaysRemaining } from '@/lib/trial'
import type { IUserLean } from '@/types'

export default function TrialBanner({ user }: { user: IUserLean }) {
  if (!isTrialActive(user)) return null

  const days = trialDaysRemaining(user)
  const end = user.trialEndsAt ? new Date(user.trialEndsAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : ''

  return (
    <div className="rounded-2xl border border-indigo-200/90 bg-gradient-to-r from-indigo-50 via-violet-50/80 to-white px-4 py-3 dark:border-indigo-500/30 dark:from-indigo-950/50 dark:via-violet-950/30 dark:to-slate-900/40 sm:px-5 sm:py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Growth trial — {days} day{days === 1 ? '' : 's'} left
            </p>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              Full Growth access until {end}. Subscribe anytime to keep WhatsApp alerts, 3 locations, and 500 AI replies/month.
            </p>
          </div>
        </div>
        <Link
          href="/subscribe?plan=growth"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Subscribe now
        </Link>
      </div>
    </div>
  )
}
