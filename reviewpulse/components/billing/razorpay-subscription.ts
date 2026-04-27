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

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')), { once: true })
      if (window.Razorpay) resolve()
      return
    }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Razorpay'))
    document.body.appendChild(s)
  })
}

/** Script sometimes registers `window.Razorpay` a tick after `onload`. */
export async function ensureRazorpayCheckoutReady(): Promise<void> {
  await loadRazorpayScript()
  const deadline = Date.now() + 8000
  while (Date.now() < deadline) {
    if (window.Razorpay) return
    await new Promise((r) => setTimeout(r, 40))
  }
  throw new Error(
    'Razorpay checkout did not load. Disable ad blockers for this site, allow checkout.razorpay.com, and try again.'
  )
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

  const prefill = sanitizePrefill(opts.prefill)
  const hasPrefill =
    Boolean(prefill?.email?.trim()) || Boolean(prefill?.name?.trim()) || Boolean(prefill?.contact?.trim())

  const options: Record<string, unknown> = {
    key: opts.key,
    subscription_id: opts.subscriptionId,
    name: opts.name,
    description: opts.description,
    handler: opts.onSuccess,
    theme: { color: '#4f46e5' },
    ...(hasPrefill ? { prefill: { email: prefill?.email, name: prefill?.name, contact: prefill?.contact } } : {}),
  }

  if (opts.onDismiss) {
    options.modal = { ondismiss: opts.onDismiss }
  }

  try {
    const rzp = new window.Razorpay(options)
    rzp.open()
  } catch (e) {
    throw e instanceof Error ? e : new Error('Razorpay Checkout could not open — check NEXT_PUBLIC_RAZORPAY_KEY_ID matches your Razorpay mode (test vs live).')
  }
}
