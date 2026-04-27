'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  ensureRazorpayCheckoutReady,
  fetchSubscriptionShortUrl,
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

export default function PlanCheckoutButtons({
  razorpayKeyId,
  userPlan,
  prefill,
}: {
  razorpayKeyId: string | undefined
  userPlan: string
  /** Improves subscription authorization success rate (Razorpay prefill). */
  prefill?: RazorpayPrefill
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
      const json = (await res.json()) as { success?: boolean; error?: string; data?: { subscriptionId?: string; shortUrl?: string } }
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

      let shortUrl = json?.data?.shortUrl
      if (!shortUrl || !String(shortUrl).startsWith('http')) {
        shortUrl = await fetchSubscriptionShortUrl(subscriptionId)
      }
      if (shortUrl) {
        toast.dismiss(loadToast)
        toast.message('Redirecting to Razorpay…')
        window.location.assign(shortUrl)
        return
      }

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
          router.refresh()
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
      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        Create matching plans in Razorpay Dashboard and set <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">RAZORPAY_PLAN_*</code> env
        vars. Webhooks update your workspace plan after payment.
      </p>
    </div>
  )
}
