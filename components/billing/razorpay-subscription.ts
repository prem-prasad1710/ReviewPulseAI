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

/** Only pass contact if it looks like E.164; bad values break Razorpay Checkout. */
function sanitizePrefill(p?: RazorpayPrefill): RazorpayPrefill | undefined {
  if (!p) return undefined
  const email = p.email?.trim() || undefined
  const name = p.name?.trim() || undefined
  let contact = p.contact?.trim().replace(/[\s-]/g, '') || undefined
  if (contact && !/^\+\d{10,14}$/.test(contact)) {
    contact = undefined
  }
  if (!email && !name && !contact) return undefined
  return { email, name, contact }
}

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'
const LOAD_TIMEOUT_MS = 8000

function waitForRazorpayGlobal(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + LOAD_TIMEOUT_MS
    const tick = () => {
      if (window.Razorpay) {
        resolve()
        return
      }
      if (Date.now() > deadline) {
        reject(new Error('Razorpay checkout did not load in time'))
        return
      }
      setTimeout(tick, 40)
    }
    tick()
  })
}

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.Razorpay) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      waitForRazorpayGlobal().then(resolve).catch(reject)
      return
    }

    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.onload = () => {
      waitForRazorpayGlobal().then(resolve).catch(reject)
    }
    s.onerror = () => reject(new Error('Failed to load Razorpay'))
    document.body.appendChild(s)
  })
}

export async function ensureRazorpayCheckoutReady(): Promise<void> {
  await loadRazorpayScript()
  if (!window.Razorpay) {
    throw new Error(
      'Razorpay checkout did not load. Disable ad blockers for this site, allow checkout.razorpay.com, and try again.'
    )
  }
}

export type RazorpayOrderCheckoutSuccess = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export type RazorpaySubscriptionCheckoutSuccess = {
  razorpay_payment_id: string
  razorpay_subscription_id: string
  razorpay_signature: string
}

export type RazorpayCheckoutSuccess = RazorpayOrderCheckoutSuccess | RazorpaySubscriptionCheckoutSuccess

/** Persists plan + subscription row immediately after Checkout (webhooks can lag). */
export async function confirmSubscriptionWithServer(response: RazorpayCheckoutSuccess): Promise<void> {
  const res = await fetch('/api/subscriptions/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response),
  })
  const json = (await res.json()) as { success?: boolean; error?: string }
  if (!res.ok || json.success === false) {
    throw new Error(typeof json.error === 'string' ? json.error : 'Could not confirm subscription with server')
  }
}

export function openRazorpayOrderModal(opts: {
  key: string
  orderId: string
  amountPaise: number
  name: string
  description: string
  prefill?: RazorpayPrefill
  onSuccess: (response: RazorpayOrderCheckoutSuccess) => void | Promise<void>
  onDismiss?: () => void
  onOpen?: () => void
}) {
  if (!window.Razorpay) {
    throw new Error('Razorpay is not loaded')
  }

  const prefill = sanitizePrefill(opts.prefill)
  const hasPrefill =
    Boolean(prefill?.email?.trim()) || Boolean(prefill?.name?.trim()) || Boolean(prefill?.contact?.trim())

  const options: Record<string, unknown> = {
    key: opts.key,
    order_id: opts.orderId,
    name: opts.name,
    description: opts.description,
    handler: (response: Record<string, unknown>) => {
      void opts.onSuccess(response as RazorpayOrderCheckoutSuccess)
    },
    theme: { color: '#4f46e5' },
    ...(hasPrefill ? { prefill: { email: prefill?.email, name: prefill?.name, contact: prefill?.contact } } : {}),
  }

  if (opts.onDismiss) {
    options.modal = { ondismiss: opts.onDismiss }
  }

  try {
    const rzp = new window.Razorpay(options)
    rzp.open()
    opts.onOpen?.()
  } catch (e) {
    throw e instanceof Error
      ? e
      : new Error(
          'Razorpay Checkout could not open — check NEXT_PUBLIC_RAZORPAY_KEY_ID matches your Razorpay mode (test vs live).'
        )
  }
}

/** @deprecated Prefer openRazorpayOrderModal — subscription checkout only auth-charges ₹5 on UPI. */
export function openRazorpaySubscriptionModal(opts: {
  key: string
  subscriptionId: string
  name: string
  description: string
  prefill?: RazorpayPrefill
  onSuccess: (response: RazorpaySubscriptionCheckoutSuccess) => void | Promise<void>
  onDismiss?: () => void
  onOpen?: () => void
}) {
  if (!window.Razorpay) {
    throw new Error('Razorpay is not loaded')
  }

  const prefill = sanitizePrefill(opts.prefill)
  const hasPrefill =
    Boolean(prefill?.email?.trim()) || Boolean(prefill?.name?.trim()) || Boolean(prefill?.contact?.trim())

  const options: Record<string, unknown> = {
    key: opts.key,
    subscription_id: opts.subscriptionId,
    name: opts.name,
    description: opts.description,
    handler: (response: Record<string, unknown>) => {
      void opts.onSuccess(response as RazorpaySubscriptionCheckoutSuccess)
    },
    theme: { color: '#4f46e5' },
    ...(hasPrefill ? { prefill: { email: prefill?.email, name: prefill?.name, contact: prefill?.contact } } : {}),
  }

  if (opts.onDismiss) {
    options.modal = { ondismiss: opts.onDismiss }
  }

  try {
    const rzp = new window.Razorpay(options)
    rzp.open()
    opts.onOpen?.()
  } catch (e) {
    throw e instanceof Error
      ? e
      : new Error(
          'Razorpay Checkout could not open — check NEXT_PUBLIC_RAZORPAY_KEY_ID matches your Razorpay mode (test vs live).'
        )
  }
}
