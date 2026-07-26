import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { verifyStandardPaymentSignature } from '@/lib/razorpay-standard-checkout'

const bodySchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
})

/** Standard Checkout — verify payment signature (do not mark paid on mismatch). */
export async function POST(request: Request) {
  try {
    await requireAuth()

    const secret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!secret) return err('Razorpay is not configured on the server', 500)

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Missing or invalid payment fields', 400)

    const valid = verifyStandardPaymentSignature(parsed.data, secret)
    if (!valid) return err('Payment signature verification failed', 400)

    return ok({
      verified: true,
      order_id: parsed.data.razorpay_order_id,
      payment_id: parsed.data.razorpay_payment_id,
    })
  } catch (error) {
    console.error('POST /api/verify-payment failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Could not verify payment', 500)
  }
}
