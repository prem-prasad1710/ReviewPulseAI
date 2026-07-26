import crypto from 'crypto'
import { getRazorpayClient } from '@/lib/razorpay'

export const MIN_RAZORPAY_AMOUNT_PAISE = 100

export type CreateStandardOrderInput = {
  amount: number
  currency?: string
  receipt: string
  notes?: Record<string, string>
}

export type StandardOrderResponse = {
  order_id: string
  amount: number
  currency: string
}

export type VerifyStandardPaymentInput = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

/** Create a Razorpay Order (Standard Checkout — server-side). */
export async function createStandardOrder(input: CreateStandardOrderInput): Promise<StandardOrderResponse> {
  const amount = Math.round(input.amount)
  if (!Number.isFinite(amount) || amount < MIN_RAZORPAY_AMOUNT_PAISE) {
    throw new Error(`Amount must be at least ${MIN_RAZORPAY_AMOUNT_PAISE} paise`)
  }

  const receipt = input.receipt.trim()
  if (!receipt) throw new Error('Receipt is required')

  const currency = (input.currency || 'INR').trim().toUpperCase()
  if (!currency) throw new Error('Currency is required')

  const rz = getRazorpayClient()
  const raw = await rz.orders.create({
    amount,
    currency,
    receipt: receipt.slice(0, 40),
    ...(input.notes ? { notes: input.notes } : {}),
  })

  const order = raw as { id: string; amount: number; currency: string }
  return {
    order_id: order.id,
    amount: order.amount,
    currency: order.currency || currency,
  }
}

/** HMAC-SHA256(subscription_id + "|" + payment_id, KEY_SECRET) — Subscription checkout verify. */
export function verifySubscriptionPaymentSignature(
  input: {
    razorpay_subscription_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  },
  keySecret: string
): boolean {
  const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = input
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_subscription_id}|${razorpay_payment_id}`)
    .digest('hex')
  return expected === razorpay_signature
}

/** HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET) — Standard Checkout verify. */
export function verifyStandardPaymentSignature(
  input: VerifyStandardPaymentInput,
  keySecret: string
): boolean {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = input
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')
  return expected === razorpay_signature
}
