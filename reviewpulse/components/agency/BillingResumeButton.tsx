'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  loadRazorpayScript,
  openRazorpaySubscriptionModal,
  type RazorpayPrefill,
} from '@/components/billing/razorpay-subscription'

type Props = {
  razorpayKeyId: string
  subscriptionId: string
  label?: string
  description: string
  brandName?: string
  prefill?: RazorpayPrefill
}

export default function BillingResumeButton({
  razorpayKeyId,
  subscriptionId,
  label = 'Open checkout',
  description,
  brandName = 'ReviewPulse',
  prefill,
}: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    loadRazorpayScript().catch(() => {})
  }, [])

  const run = async () => {
    setBusy(true)
    let loadToast: string | number | undefined
    try {
      const res = await fetch('/api/subscriptions/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Could not resume checkout')
        return
      }
      loadToast = toast.loading('Opening Razorpay payment…')
      const shortUrl = json?.data?.shortUrl as string | undefined
      const sid = (json?.data?.subscriptionId as string | undefined) || subscriptionId
      if (shortUrl) {
        toast.dismiss(loadToast)
        window.location.assign(shortUrl)
        return
      }
      await loadRazorpayScript()
      toast.dismiss(loadToast)
      toast.message('Complete payment in the Razorpay window.')
      openRazorpaySubscriptionModal({
        key: razorpayKeyId,
        subscriptionId: sid,
        name: brandName,
        description,
        prefill,
        onSuccess: () => {
          toast.success('Payment authorized — your plan will update in a moment.')
          router.refresh()
        },
        onDismiss: () => toast.message('Checkout closed — you can resume anytime from Billing.'),
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Checkout error')
    } finally {
      if (loadToast !== undefined) toast.dismiss(loadToast)
      setBusy(false)
    }
  }

  return (
    <Button type="button" size="sm" variant="secondary" className="rounded-xl" disabled={busy} onClick={run}>
      {busy ? '…' : label}
    </Button>
  )
}
