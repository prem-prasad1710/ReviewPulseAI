'use client'

import {
  ensureRazorpayCheckoutReady,
  openRazorpayOrderModal,
  type RazorpayOrderCheckoutSuccess,
  type RazorpayPrefill,
} from '@/components/billing/razorpay-subscription'
import {
  clearCheckoutToast,
  showCheckoutError,
  showCheckoutLoading,
  showCheckoutSuccess,
} from '@/lib/checkout-toast'

export type StartStandardCheckoutOpts = {
  razorpayKeyId: string
  amountPaise: number
  currency?: string
  receipt: string
  name: string
  description: string
  prefill?: RazorpayPrefill
  onVerified?: (response: RazorpayOrderCheckoutSuccess) => void | Promise<void>
  onDismiss?: () => void
}

async function verifyPaymentWithServer(response: RazorpayOrderCheckoutSuccess): Promise<void> {
  const res = await fetch('/api/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response),
  })
  const json = (await res.json()) as { success?: boolean; error?: string }
  if (!res.ok || json.success === false) {
    throw new Error(typeof json.error === 'string' ? json.error : 'Payment verification failed')
  }
}

/** Generic Standard Checkout: create-order → modal → verify-payment. */
export async function startStandardCheckout(opts: StartStandardCheckoutOpts): Promise<void> {
  clearCheckoutToast()

  const res = await fetch('/api/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: opts.amountPaise,
      currency: opts.currency || 'INR',
      receipt: opts.receipt,
    }),
  })
  const json = (await res.json()) as {
    success?: boolean
    error?: string
    data?: { order_id?: string; amount?: number; currency?: string }
  }

  if (!res.ok) {
    throw new Error(json?.error || 'Could not create order')
  }

  const orderId = json?.data?.order_id
  const amount = json?.data?.amount
  if (!orderId || typeof amount !== 'number') {
    throw new Error('Order could not be created. Try again.')
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
        name: opts.name,
        description: opts.description,
        prefill: opts.prefill,
        onOpen: () => clearCheckoutToast(),
        onPaymentFailed: (message) => {
          clearCheckoutToast()
          showCheckoutError(message || 'Payment failed. Please try again.', 12000)
          reject(new Error('PAYMENT_FAILED'))
        },
        onSuccess: async (checkout) => {
          clearCheckoutToast()
          showCheckoutLoading('Confirming your payment…')
          try {
            await verifyPaymentWithServer(checkout)
            clearCheckoutToast()
            showCheckoutSuccess('Payment verified successfully.')
            await opts.onVerified?.(checkout)
            resolve()
          } catch (e) {
            clearCheckoutToast()
            reject(e instanceof Error ? e : new Error('Payment verification failed'))
          }
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
