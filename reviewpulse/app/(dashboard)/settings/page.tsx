import Link from 'next/link'
import { CreditCard, MapPin, MessageSquare, Sparkles } from 'lucide-react'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getAppSession } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import PlanCheckoutButtons from '@/components/billing/PlanCheckoutButtons'
import { PLAN_LIMITS, effectiveLocationLimit } from '@/lib/plans'
import { formatCurrencyINR } from '@/lib/utils'
import type { IUserLean, Plan } from '@/types'
import WhatsAppCard from '@/components/settings/WhatsAppCard'

function subscriptionBadge(status: string) {
  const map: Record<string, string> = {
    active: 'border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200',
    inactive: 'border-slate-200/90 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
    cancelled: 'border-amber-200/90 bg-amber-50 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200',
    past_due: 'border-rose-200/90 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200',
  }
  return map[status] || map.inactive
}

export default async function SettingsPage() {
  await connectDB()
  const session = await getAppSession()

  const user = session?.user?.id ? await User.findById(session.user.id).lean() : null

  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300/90 bg-gradient-to-b from-slate-50 to-white px-6 py-12 text-center dark:border-slate-600 dark:from-slate-900/50 dark:to-slate-900/30">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Unable to load account settings</p>
        <p className="mx-auto mt-2 max-w-sm text-xs text-slate-500 dark:text-slate-400">Sign in again or check your database connection.</p>
      </div>
    )
  }

  const plan = user.plan as Plan
  const currentLimit = plan in PLAN_LIMITS ? PLAN_LIMITS[plan] : PLAN_LIMITS.free
  const locationCap = effectiveLocationLimit(user as IUserLean)
  const replyLimit = currentLimit.repliesPerMonth
  const used = user.repliesUsedThisMonth ?? 0
  const pct = replyLimit === -1 ? 100 : Math.min(100, Math.round((used / replyLimit) * 100))
  const barPct = replyLimit === -1 ? 100 : pct

  return (
    <div className="space-y-8 pb-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Workspace</p>
        <h2 className="font-heading mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
          Settings &amp; billing
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Plan limits, reply quota, and subscription status—aligned with what your team sees in the inbox.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="relative overflow-hidden border-slate-200/90 p-0 dark:border-slate-700/80">
          <div className="border-b border-indigo-100/90 bg-gradient-to-br from-indigo-50 via-white to-violet-50/80 px-6 py-5 dark:border-indigo-500/20 dark:from-indigo-950/50 dark:via-slate-900 dark:to-violet-950/30">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Current plan</p>
                <CardTitle className="mt-1 font-heading text-2xl capitalize text-slate-900 dark:text-slate-50">{plan}</CardTitle>
                <CardDescription className="mt-2 text-slate-600 dark:text-slate-400">
                  {currentLimit.price === 0
                    ? 'Free tier — explore core workflows before you scale.'
                    : `${formatCurrencyINR(currentLimit.price)} / month · billed via Razorpay`}
                </CardDescription>
              </div>
              <Badge className={`shrink-0 font-medium capitalize ${subscriptionBadge(user.subscriptionStatus)}`}>
                {user.subscriptionStatus.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-700/80 dark:bg-slate-800/40">
              <MapPin className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Locations</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Up to {locationCap} {locationCap === 1 ? 'location' : 'locations'}
                </p>
                {plan === 'agency' && (user.agencyLocationAddons ?? 0) > 0 ? (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Base {PLAN_LIMITS.agency.locations} + {user.agencyLocationAddons} Razorpay add-on slot
                    {(user.agencyLocationAddons ?? 0) === 1 ? '' : 's'}.
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-700/80 dark:bg-slate-800/40">
              <MessageSquare className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">AI replies / month</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {replyLimit === -1 ? 'Unlimited' : replyLimit.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            <PlanCheckoutButtons
              razorpayKeyId={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}
              userPlan={plan}
              prefill={{
                email: user.email ?? undefined,
                name: user.name ?? undefined,
                contact: user.whatsappNumber ?? undefined,
              }}
            />
          </div>
        </Card>

        <Card className="border-slate-200/90 p-6 dark:border-slate-700/80 sm:p-7">
          <div className="mb-5 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <CardTitle className="font-heading text-lg dark:text-slate-100">Reply quota</CardTitle>
          </div>
          <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
            Resets on your billing cycle. Slow down before you hit the cap so drafts never block your team.
          </CardDescription>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
              <span>Used this month</span>
              <span className="tabular-nums text-slate-900 dark:text-slate-100">
                {used.toLocaleString('en-IN')}
                {replyLimit === -1 ? ' · Unlimited' : ` / ${replyLimit.toLocaleString('en-IN')}`}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/90 ring-1 ring-slate-900/[0.04] dark:bg-slate-800 dark:ring-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 transition-[width] duration-500 dark:from-indigo-500 dark:via-violet-500 dark:to-blue-500"
                style={{ width: `${barPct}%` }}
              />
            </div>
            {replyLimit !== -1 && pct >= 85 ? (
              <p className="mt-3 text-xs font-medium text-amber-800 dark:text-amber-200/90">
                You are close to your monthly limit—upgrade or pace AI drafts until reset.
              </p>
            ) : null}
          </div>
        </Card>

        <Card className="border-slate-200/90 p-6 dark:border-slate-700/80 sm:p-7">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <CardTitle className="font-heading text-lg dark:text-slate-100">Account</CardTitle>
          </div>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</dt>
              <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</dt>
              <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{user.email}</dd>
            </div>
            {user.razorpayCustomerId ? (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Billing</dt>
                <dd className="mt-0.5 font-mono text-xs text-slate-600 dark:text-slate-400">Customer linked</dd>
              </div>
            ) : (
              <p className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                No Razorpay customer on file yet—subscribe from checkout when you are ready.
              </p>
            )}
          </dl>
        </Card>

        <WhatsAppCard />

        <Card className="border-slate-200/90 bg-gradient-to-br from-slate-50/80 to-white p-6 dark:border-slate-700/80 dark:from-slate-900/60 dark:to-slate-950/40 sm:p-7">
          <CardTitle className="font-heading text-lg dark:text-slate-100">Need more capacity?</CardTitle>
          <CardDescription className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Growth and Scale unlock higher reply limits and more locations—same inbox, faster coverage.
          </CardDescription>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="rounded-xl border-slate-200 dark:border-slate-600">
                View pricing
              </Button>
            </Link>
            <Link href="/reviews">
              <Button size="sm" className="rounded-xl">
                Open inbox
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
