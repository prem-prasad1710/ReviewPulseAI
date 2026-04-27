'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  ensureRazorpayCheckoutReady,
  loadRazorpayScript,
  openRazorpaySubscriptionModal,
  type RazorpayPrefill,
} from '@/components/billing/razorpay-subscription'
import type { RazorpayPlanKey } from '@/lib/razorpay'

const LABELS: Record<RazorpayPlanKey, string> = {
  starter: 'Starter — ₹999/mo',
  growth: 'Growth — ₹2,499/mo',
  scale: 'Scale — ₹5,999/mo',
  agency: 'Agency — ₹9,999/mo (20 client locations)',
  agency_addon: 'Extra agency location — ₹299/mo',
}

type FocusedSmbPlan = 'starter' | 'growth' | 'scale'

export default function PlanCheckoutButtons({
  razorpayKeyId,
  userPlan,
  prefill,
  variant = 'full',
  focusedPlan,
  showAgencyRow = true,
  successRedirect,
}: {
  razorpayKeyId: string | undefined
  userPlan: string
  prefill?: RazorpayPrefill
  /** `focused` = one primary CTA (e.g. landing → /subscribe). */
  variant?: 'full' | 'focused'
  focusedPlan?: FocusedSmbPlan
  showAgencyRow?: boolean
  /** After successful mandate (e.g. `/dashboard`). Default: refresh current route. */
  successRedirect?: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<RazorpayPlanKey | null>(null)

  useEffect(() => {
    if (!razorpayKeyId) return
    loadRazorpayScript().catch(() => {
      /* non-fatal — will retry on pay click */
    })
  }, [razorpayKeyId])

  const start = async (plan: RazorpayPlanKey) => {
    if (!razorpayKeyId) {
      toast.error('Razorpay is not configured (missing NEXT_PUBLIC_RAZORPAY_KEY_ID).')
      return
    }
    setBusy(plan)
    let loadToast: string | number | undefined
    try {
      const res = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const json = (await res.json()) as { success?: boolean; error?: string; data?: { subscriptionId?: string } }
      if (!res.ok) {
        toast.error(json?.error || 'Could not create subscription')
        return
      }
      const subscriptionId = json?.data?.subscriptionId
      if (!subscriptionId) {
        toast.error('No subscription id returned')
        return
      }

      loadToast = toast.loading('Opening Razorpay payment…')

      /* Do not redirect to api.razorpay.com/v1/t/subscriptions/… — Razorpay often returns
       * "Hosted page is not available" for that URL. Subscription auth is done via Checkout modal. */
      await ensureRazorpayCheckoutReady()
      toast.dismiss(loadToast)
      toast.message('Complete payment in the Razorpay window (popup overlay).')
      openRazorpaySubscriptionModal({
        key: razorpayKeyId,
        subscriptionId,
        name: plan === 'agency' || plan === 'agency_addon' ? 'ReviewPulse Agency' : 'ReviewPulse',
        description: LABELS[plan],
        prefill,
        onSuccess: () => {
          toast.success('Payment authorized — your plan will update in a moment.')
          if (successRedirect) router.push(successRedirect)
          else router.refresh()
        },
        onDismiss: () =>
          toast.message('Checkout closed — if you did not see it, check for overlays or try again.'),
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Checkout error')
    } finally {
      if (loadToast !== undefined) toast.dismiss(loadToast)
      setBusy(null)
    }
  }

  if (!razorpayKeyId) {
    return (
      <p className="text-xs text-amber-800 dark:text-amber-200/90">
        Set <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">NEXT_PUBLIC_RAZORPAY_KEY_ID</code> in Vercel
        env and redeploy. It must match your Razorpay key mode (test vs live).
      </p>
    )
  }

  const showAgencyAddon = userPlan === 'agency'
  const focus = variant === 'focused' && focusedPlan ? focusedPlan : null

  if (focus) {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          size="lg"
          className="w-full rounded-xl py-6 text-base font-semibold shadow-lg shadow-indigo-600/20"
          disabled={busy !== null}
          onClick={() => start(focus)}
        >
          {busy === focus ? 'Opening…' : `Pay with Razorpay — ${LABELS[focus]}`}
        </Button>
        <p className="text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          Secure overlay on this site. Allow <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">checkout.razorpay.com</code> if a blocker hides it.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-slate-100 pt-4 text-xs dark:border-slate-700">
          <Link href="/settings" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            All plans &amp; invoices →
          </Link>
          <Link href="/#pricing" className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">
            Compare on homepage
          </Link>
        </div>
        {showAgencyRow ? (
          <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-700">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Agencies &amp; white-label
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="rounded-xl bg-violet-600 text-white hover:bg-violet-700"
                disabled={busy !== null || userPlan === 'agency'}
                onClick={() => start('agency')}
              >
                {busy === 'agency' ? '…' : LABELS.agency}
              </Button>
              {showAgencyAddon ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="rounded-xl"
                  disabled={busy !== null}
                  onClick={() => start('agency_addon')}
                >
                  {busy === 'agency_addon' ? '…' : LABELS.agency_addon}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Start or change subscription (Razorpay Checkout)
      </p>
      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        After you pick a plan, Razorpay opens as a <strong className="font-medium text-slate-600 dark:text-slate-300">secure overlay</strong> on this page (not always a new tab). Allow{' '}
        <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">checkout.razorpay.com</code> if an ad blocker hides it.
      </p>
      <div className="flex flex-wrap gap-2">
        {(['starter', 'growth', 'scale'] as const).map((p) => (
          <Button
            key={p}
            type="button"
            size="sm"
            variant="outline"
            className="rounded-xl"
            disabled={busy !== null}
            onClick={() => start(p)}
          >
            {busy === p ? '…' : LABELS[p]}
          </Button>
        ))}
      </div>
      {showAgencyRow ? (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
          <Button
            type="button"
            size="sm"
            className="rounded-xl bg-violet-600 text-white hover:bg-violet-700"
            disabled={busy !== null || userPlan === 'agency'}
            onClick={() => start('agency')}
          >
            {busy === 'agency' ? '…' : LABELS.agency}
          </Button>
          {showAgencyAddon ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-xl"
              disabled={busy !== null}
              onClick={() => start('agency_addon')}
            >
              {busy === 'agency_addon' ? '…' : LABELS.agency_addon}
            </Button>
          ) : null}
        </div>
      ) : null}
      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        Create matching plans in Razorpay Dashboard and set <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">RAZORPAY_PLAN_*</code> env
        vars. Webhooks update your workspace plan after payment.
      </p>
    </div>
  )
}
