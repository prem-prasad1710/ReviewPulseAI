'use client'

import { toast } from 'sonner'
import {
  confirmSubscriptionWithServer,
  ensureRazorpayCheckoutReady,
  openRazorpayOrderModal,
  type RazorpayPrefill,
} from '@/components/billing/razorpay-subscription'
import { checkoutAmountMismatch } from '@/lib/razorpay-checkout-amounts'
import type { RazorpayPlanKey } from '@/lib/razorpay'
import { RAZORPAY_PLAN_CHECKOUT_NAMES } from '@/lib/razorpay-plan-names'

type StartOrderCheckoutOpts = {
  razorpayKeyId: string
  plan: RazorpayPlanKey
  description: string
  prefill?: RazorpayPrefill
  displayName?: string
  onConfirmed?: () => void | Promise<void>
  onDismiss?: () => void
}

function dismissToast(id: string | number | undefined) {
  if (id !== undefined) toast.dismiss(id)
}

export async function startOrderCheckout(opts: StartOrderCheckoutOpts): Promise<void> {
  const res = await fetch('/api/subscriptions/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan: opts.plan }),
  })
  const json = (await res.json()) as {
    success?: boolean
    error?: string
    data?: { orderId?: string; amount?: number; displayName?: string }
  }

  if (!res.ok) {
    throw new Error(json?.error || 'Could not start checkout')
  }

  const orderId = json?.data?.orderId
  const amount = json?.data?.amount
  if (!orderId || typeof amount !== 'number') {
    throw new Error('Checkout could not be started. Try again or contact support.')
  }

  const amountError = checkoutAmountMismatch(opts.plan, amount)
  if (amountError) {
    throw new Error(amountError)
  }

  let toastId: string | number | undefined

  try {
    toastId = toast.loading('Opening Razorpay payment…')
    await ensureRazorpayCheckoutReady()
    dismissToast(toastId)
    toastId = undefined

    await new Promise<void>((resolve, reject) => {
      let modalOpened = false

      openRazorpayOrderModal({
        key: opts.razorpayKeyId,
        orderId,
        amountPaise: amount,
        name: opts.displayName || json?.data?.displayName || RAZORPAY_PLAN_CHECKOUT_NAMES[opts.plan],
        description: opts.description,
        prefill: opts.prefill,
        onOpen: () => {
          modalOpened = true
          dismissToast(toastId)
          toastId = undefined
        },
        onSuccess: async (checkout) => {
          dismissToast(toastId)
          toastId = undefined
          toastId = toast.loading('Confirming payment…')
          try {
            await confirmSubscriptionWithServer(checkout)
            dismissToast(toastId)
            toastId = undefined
            await opts.onConfirmed?.()
            resolve()
          } catch (e) {
            dismissToast(toastId)
            toastId = undefined
            reject(e instanceof Error ? e : new Error('Could not confirm payment with server'))
          }
        },
        onPaymentFailed: (message) => {
          dismissToast(toastId)
          toastId = undefined
          toast.error(message, { duration: 12000 })
          reject(new Error('PAYMENT_FAILED'))
        },
        onDismiss: () => {
          dismissToast(toastId)
          toastId = undefined
          if (!modalOpened) {
            toast.message('Checkout closed — you can resume anytime from Billing.')
          }
          opts.onDismiss?.()
          reject(new Error('CHECKOUT_DISMISSED'))
        },
      })
    })
  } finally {
    dismissToast(toastId)
  }
}
