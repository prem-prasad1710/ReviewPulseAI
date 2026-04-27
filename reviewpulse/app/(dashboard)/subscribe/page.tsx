import Link from 'next/link'
import { ArrowLeft, CreditCard, Lock, ShieldCheck } from 'lucide-react'
import { redirect } from 'next/navigation'
import PlanCheckoutButtons from '@/components/billing/PlanCheckoutButtons'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { getAppSession } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import type { IUserLean } from '@/types'

const SMB_PLANS = ['starter', 'growth', 'scale'] as const
type SmbPlan = (typeof SMB_PLANS)[number]

function parsePlan(raw: string | string[] | undefined): SmbPlan | null {
  const v = Array.isArray(raw) ? raw[0] : raw
  if (!v || typeof v !== 'string') return null
  const p = v.toLowerCase().trim()
  return SMB_PLANS.includes(p as SmbPlan) ? (p as SmbPlan) : null
}

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getAppSession()
  if (!session?.user?.id) redirect('/login?callbackUrl=%2Fsubscribe')

  const params = await searchParams
  const plan = parsePlan(params?.plan)
  if (!plan) {
    redirect('/#pricing')
  }

  await connectDB()
  const user = await User.findById(session.user.id).lean()
  if (!user) redirect('/login')

  const u = user as unknown as IUserLean
  const userPlan = u.plan || 'free'

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-4">
      <div>
        <Link
          href="/#pricing"
          className="-ml-1 mb-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to pricing
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Checkout</p>
        <h1 className="font-heading mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
          Complete your subscription
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          You chose the <span className="font-semibold capitalize text-slate-900 dark:text-slate-100">{plan}</span> plan.
          Payment runs on Razorpay in a secure overlay—same flow as Settings → Billing.
        </p>
      </div>

      <Card className="border-slate-200/90 p-5 dark:border-slate-700/80 dark:bg-slate-900/50 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50 px-2.5 py-1 dark:border-slate-600 dark:bg-slate-800/80">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            PCI-grade checkout
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50 px-2.5 py-1 dark:border-slate-600 dark:bg-slate-800/80">
            <Lock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            Razorpay subscriptions
          </span>
        </div>
        <div className="mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <CreditCard className="h-5 w-5" />
          <CardTitle className="text-base dark:text-slate-100">Pay with Razorpay</CardTitle>
        </div>
        <CardDescription className="text-sm dark:text-slate-400">
          Use a test card in Test mode, or your real card in Live mode. After authorization, webhooks update your plan—usually within a minute.
        </CardDescription>
        <div className="mt-5">
          <PlanCheckoutButtons
            razorpayKeyId={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}
            userPlan={userPlan}
            variant="focused"
            focusedPlan={plan}
            showAgencyRow
            successRedirect="/dashboard"
            prefill={{
              email: u.email ?? undefined,
              name: u.name ?? undefined,
              contact: u.whatsappNumber ?? undefined,
            }}
          />
        </div>
      </Card>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Need invoices, add-ons, or to switch plans later?{' '}
        <Link href="/settings" className="font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400">
          Billing in Settings
        </Link>
      </p>
    </div>
  )
}
