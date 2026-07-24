'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { startOrderCheckout } from '@/components/billing/start-order-checkout'
import { loadRazorpayScript, type RazorpayPrefill } from '@/components/billing/razorpay-subscription'
import type { RazorpayPlanKey } from '@/lib/razorpay'

type Props = {
  razorpayKeyId: string
  plan: RazorpayPlanKey
  label?: string
  description: string
  prefill?: RazorpayPrefill
}

export default function BillingResumeButton({
  razorpayKeyId,
  plan,
  label = 'Open checkout',
  description,
  prefill,
}: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    loadRazorpayScript().catch(() => {})
  }, [])

  const run = async () => {
    setBusy(true)
    try {
      await startOrderCheckout({
        razorpayKeyId,
        plan,
        description,
        prefill,
        onConfirmed: async () => {
          toast.success('Payment confirmed — billing updated.')
          router.refresh()
        },
        onDismiss: () => {
          toast.message('Checkout closed — you can resume anytime from Billing.')
        },
      })
    } catch (e) {
      if (e instanceof Error && e.message === 'CHECKOUT_DISMISSED') return
      toast.error('Checkout could not be completed. Please try again or contact support.')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button type="button" size="sm" variant="secondary" className="rounded-xl" disabled={busy} onClick={run}>
      {busy ? '…' : label}
    </Button>
  )
}
