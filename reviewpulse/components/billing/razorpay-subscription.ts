'use client'

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

export type RazorpayPrefill = {
  email?: string
  name?: string
  contact?: string
}

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Razorpay'))
    document.body.appendChild(s)
  })
}

export function openRazorpaySubscriptionModal(opts: {
  key: string
  subscriptionId: string
  name: string
  description: string
  prefill?: RazorpayPrefill
  onSuccess: () => void
  onDismiss?: () => void
}) {
  if (!window.Razorpay) {
    throw new Error('Razorpay is not loaded')
  }

  const prefill = opts.prefill
  const hasPrefill =
    Boolean(prefill?.email?.trim()) || Boolean(prefill?.name?.trim()) || Boolean(prefill?.contact?.trim())

  const options: Record<string, unknown> = {
    key: opts.key,
    subscription_id: opts.subscriptionId,
    name: opts.name,
    description: opts.description,
    handler: opts.onSuccess,
    theme: { color: '#4f46e5' },
    /** Helps Razorpay pre-bind the payer (email/contact) for smoother authorization. */
    ...(hasPrefill ? { prefill: { email: prefill?.email, name: prefill?.name, contact: prefill?.contact } } : {}),
    /** Keeps payer aligned with the Razorpay customer created on the server. */
    ...(prefill?.email?.trim()
      ? { readonly: { email: true, name: false, contact: false } }
      : {}),
  }

  if (opts.onDismiss) {
    options.modal = { ondismiss: opts.onDismiss }
  }

  try {
    const rzp = new window.Razorpay(options)
    rzp.open()
  } catch (e) {
    throw e instanceof Error ? e : new Error('Razorpay Checkout could not open — check your key and try again.')
  }
}
