import Link from 'next/link'
import { CreditCard } from 'lucide-react'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import BillingResumeButton from '@/components/agency/BillingResumeButton'
import { PLAN_LIMITS } from '@/lib/plans'
import { formatCurrencyINR } from '@/lib/utils'
import type { BillingSummary } from '@/lib/billing-summary'

const RESUMABLE = new Set(['created', 'authenticated', 'pending', 'halted'])

export default function SettingsBillingPanel({
  summary,
  razorpayKeyId,
  prefill,
}: {
  summary: BillingSummary | null
  razorpayKeyId?: string
  prefill?: { email?: string; name?: string; contact?: string }
}) {
  if (!summary?.primarySubscriptionId || !summary.primaryLive) return null
  if (!RESUMABLE.has(summary.primaryLive.status)) return null
  if (!razorpayKeyId) return null

  const planLabel = summary.plan in PLAN_LIMITS ? summary.plan : 'starter'
  const price =
    planLabel in PLAN_LIMITS ? formatCurrencyINR(PLAN_LIMITS[planLabel as keyof typeof PLAN_LIMITS].price) : ''

  return (
    <Card className="border-amber-200/90 bg-amber-50/30 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base text-amber-950 dark:text-amber-100">Complete your checkout</CardTitle>
          <CardDescription className="mt-2 text-sm text-amber-900/90 dark:text-amber-200/90">
            Your {planLabel} subscription is waiting for payment ({summary.primaryLive.status.replace(/_/g, ' ')}).
            {price ? ` ${price}/month after checkout.` : ''}
          </CardDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            <BillingResumeButton
              razorpayKeyId={razorpayKeyId}
              subscriptionId={summary.primarySubscriptionId}
              label="Resume Razorpay checkout"
              description={`ReviewPulse ${planLabel} plan`}
              prefill={prefill}
            />
            <Link
              href={`/subscribe?plan=${planLabel === 'agency' ? 'growth' : planLabel}`}
              className="inline-flex h-9 items-center rounded-xl border border-amber-300/80 bg-white px-3 text-xs font-semibold text-amber-950 hover:bg-amber-50 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-100"
            >
              Change plan
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}
