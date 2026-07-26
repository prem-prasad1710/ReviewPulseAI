import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { createStandardOrder, MIN_RAZORPAY_AMOUNT_PAISE } from '@/lib/razorpay-standard-checkout'

const bodySchema = z.object({
  amount: z.number().int().min(MIN_RAZORPAY_AMOUNT_PAISE),
  currency: z.string().min(3).max(3).default('INR'),
  receipt: z.string().min(1).max(40),
})

/** Standard Checkout — create Razorpay order. */
export async function POST(request: Request) {
  try {
    await requireAuth()

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return err(`Invalid input — amount must be at least ${MIN_RAZORPAY_AMOUNT_PAISE} paise`, 400)
    }

    const order = await createStandardOrder(parsed.data)
    return ok(order)
  } catch (error) {
    console.error('POST /api/create-order failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    if (error instanceof Error && error.message.startsWith('Missing Razorpay credentials')) {
      return err('Razorpay authentication failed — check server credentials', 401)
    }
    if (error instanceof Error && error.message.startsWith('Amount must be')) {
      return err(error.message, 400)
    }
    return err('Failed to create order', 500)
  }
}
