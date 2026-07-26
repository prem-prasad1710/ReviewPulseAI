'use client'

import {
  confirmSubscriptionWithServer,
  ensureRazorpayCheckoutReady,
  openRazorpayOrderModal,
  type RazorpayPrefill,
} from '@/components/billing/razorpay-subscription'
import {
  clearCheckoutToast,
  showCheckoutError,
  showCheckoutLoading,
  showCheckoutSuccess,
} from '@/lib/checkout-toast'
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

export async function startOrderCheckout(opts: StartOrderCheckoutOpts): Promise<void> {
  clearCheckoutToast()

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

  try {
    showCheckoutLoading('Opening secure payment…')
    await ensureRazorpayCheckoutReady()
    clearCheckoutToast()

    await new Promise<void>((resolve, reject) => {
      openRazorpayOrderModal({
        key: opts.razorpayKeyId,
        orderId,
        amountPaise: amount,
        name: opts.displayName || json?.data?.displayName || RAZORPAY_PLAN_CHECKOUT_NAMES[opts.plan],
        description: opts.description,
        prefill: opts.prefill,
        onOpen: () => clearCheckoutToast(),
        onSuccess: async (checkout) => {
          clearCheckoutToast()
          showCheckoutLoading('Confirming your payment…')
          try {
            await confirmSubscriptionWithServer(checkout)
            clearCheckoutToast()
            showCheckoutSuccess('Payment confirmed. Your plan is active.')
            await opts.onConfirmed?.()
            resolve()
          } catch (e) {
            clearCheckoutToast()
            reject(e instanceof Error ? e : new Error('Could not confirm payment with server'))
          }
        },
        onPaymentFailed: (message) => {
          clearCheckoutToast()
          showCheckoutError(message, 12000)
          reject(new Error('PAYMENT_FAILED'))
        },
        onDismiss: () => {
          clearCheckoutToast()
          opts.onDismiss?.()
          reject(new Error('CHECKOUT_DISMISSED'))
        },
      })
    })
  } finally {
    clearCheckoutToast()
  }
}
