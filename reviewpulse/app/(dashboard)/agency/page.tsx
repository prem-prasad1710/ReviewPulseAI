import Link from 'next/link'
import { Building2 } from 'lucide-react'
import AgencyBillingPanel from '@/components/agency/AgencyBillingPanel'
import AgencyWorkspace from '@/components/agency/AgencyWorkspace'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { getBillingSummary } from '@/lib/billing-summary'
import { getAppSession } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import Agency from '@/models/Agency'
import User from '@/models/User'

export default async function AgencyPage() {
  await connectDB()
  const session = await getAppSession()
  const userId = session?.user?.id
  if (!userId) {
    return <p className="text-sm text-slate-600">Sign in to manage agency workspace.</p>
  }

  const user = await User.findById(userId).lean()
  const plan = (user?.plan as string) || 'free'

  if (plan !== 'agency') {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <Building2 className="mx-auto h-12 w-12 text-indigo-600" />
        <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-50">Agency white-label</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Feature 7 — resell ReviewPulse under your brand. Requires the Agency plan. Map custom domains via{' '}
          <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">AGENCY_HOST_MAP</code> in production.
        </p>
        <Link
          href="/settings"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-[#2563EB] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#1f56c8]"
        >
          Billing &amp; plans
        </Link>
      </div>
    )
  }

  const agency = await Agency.findOne({ ownerId: userId }).lean()
  const billing = await getBillingSummary(String(userId))
  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

  const clients =
    agency && agency.clientIds?.length
      ? await User.find({ _id: { $in: agency.clientIds } })
          .select('name email plan subscriptionStatus')
          .lean()
      : []

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          Feature 7
        </p>
        <h1 className="font-heading mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">Agency workspace</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Clients linked via invite token inherit your branding when{' '}
          <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">AGENCY_HOST_MAP</code> is configured.
        </p>
      </div>

      {billing ? (
        <AgencyBillingPanel
          billing={billing}
          razorpayKeyId={razorpayKeyId}
          checkoutPrefill={{
            email: user?.email ?? undefined,
            name: user?.name ?? undefined,
            contact: user?.whatsappNumber ?? undefined,
          }}
        />
      ) : null}

      <AgencyWorkspace
        initialAgency={
          agency
            ? {
                name: agency.name,
                slug: agency.slug,
                inviteToken: agency.inviteToken,
                customDomain: agency.customDomain,
              }
            : null
        }
        clients={clients.map((c) => ({
          id: String(c._id),
          name: c.name,
          email: c.email,
          plan: c.plan,
          subscriptionStatus: c.subscriptionStatus,
        }))}
      />

      {!agency ? (
        <Card className="border-dashed p-6 dark:border-slate-600">
          <CardTitle className="text-base dark:text-slate-100">Create your agency profile</CardTitle>
          <CardDescription>Use the form above to generate an invite link.</CardDescription>
        </Card>
      ) : null}
    </div>
  )
}
