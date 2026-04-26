import type { BillingSummary } from '@/lib/billing-summary'
import BillingResumeButton from '@/components/agency/BillingResumeButton'
import type { RazorpayPrefill } from '@/components/billing/razorpay-subscription'

const INCOMPLETE = new Set(['created', 'authenticated', 'pending'])

export default function AgencyBillingPanel({
  billing,
  razorpayKeyId,
  checkoutPrefill,
}: {
  billing: BillingSummary
  razorpayKeyId: string | undefined
  checkoutPrefill?: RazorpayPrefill
}) {
  const dbPrimary = billing.subscriptions.find(
    (s) => s.razorpaySubscriptionId === billing.primarySubscriptionId
  )
  const primaryStatus = billing.primaryLive?.status ?? dbPrimary?.status ?? '—'
  const needsResume =
    billing.primarySubscriptionId &&
    razorpayKeyId &&
    (INCOMPLETE.has(primaryStatus) || Boolean(billing.primaryLive?.short_url))

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
      <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-50">Billing</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Razorpay customer and subscription ids for your workspace. Merchant dashboard links open in a new tab (sign in
        with your Razorpay account).
      </p>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Razorpay customer
          </dt>
          <dd className="mt-1 font-mono text-xs break-all text-slate-900 dark:text-slate-100">
            {billing.customerId || '— (created at first checkout)'}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Primary subscription
          </dt>
          <dd className="mt-1 font-mono text-xs break-all text-slate-900 dark:text-slate-100">
            {billing.primarySubscriptionId || '—'}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Live status (Razorpay)
          </dt>
          <dd className="mt-1 text-slate-900 dark:text-slate-100">{primaryStatus}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Workspace plan
          </dt>
          <dd className="mt-1 capitalize text-slate-900 dark:text-slate-100">
            {billing.plan}
            {billing.subscriptionStatus ? (
              <span className="text-slate-500 dark:text-slate-400"> · {billing.subscriptionStatus}</span>
            ) : null}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={billing.dashboardLinks.subscriptionsIndex}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Razorpay subscriptions
        </a>
        {billing.dashboardLinks.primarySubscription ? (
          <a
            href={billing.dashboardLinks.primarySubscription}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            This subscription in dashboard
          </a>
        ) : null}
        {billing.primaryLive?.short_url ? (
          <a
            href={billing.primaryLive.short_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center rounded-xl bg-indigo-600 px-3 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Complete mandate / payment
          </a>
        ) : null}
        {needsResume && billing.primarySubscriptionId ? (
          <BillingResumeButton
            razorpayKeyId={razorpayKeyId!}
            subscriptionId={billing.primarySubscriptionId}
            label="Resume checkout"
            description="ReviewPulse Agency — complete subscription"
            brandName="ReviewPulse Agency"
            prefill={checkoutPrefill}
          />
        ) : null}
      </div>

      {billing.subscriptions.length > 0 ? (
        <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-700">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Recent subscription records
          </h3>
          <ul className="mt-2 space-y-2 text-xs text-slate-700 dark:text-slate-300">
            {billing.subscriptions.slice(0, 8).map((s) => (
              <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1.5 font-mono dark:bg-slate-800/60">
                <span className="break-all">{s.razorpaySubscriptionId}</span>
                <span className="shrink-0 text-slate-500 dark:text-slate-400">
                  {s.plan} · {s.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
