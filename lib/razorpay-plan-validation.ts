import { PLAN_CHECKOUT_AMOUNT_PAISE } from '@/lib/razorpay-checkout-amounts'
import { getRazorpayClient, type RazorpayPlanKey } from '@/lib/razorpay'

/** Expected monthly charge in paise (INR × 100). Must match Razorpay Dashboard → Plans. */
export const EXPECTED_PLAN_AMOUNT_PAISE = PLAN_CHECKOUT_AMOUNT_PAISE

function formatInrFromPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    paise / 100
  )
}

type RazorpayPlanEntity = {
  id?: string
  item?: { amount?: number; currency?: string; name?: string }
}

/**
 * Ensures the Razorpay plan id in env charges the price shown in the app.
 * Prevents checkout at ₹5 when UI says ₹999 / ₹2,499 etc.
 */
export async function assertRazorpayPlanAmount(planKey: RazorpayPlanKey, razorpayPlanId: string): Promise<void> {
  if (process.env.RAZORPAY_SKIP_PLAN_AMOUNT_CHECK === 'true') return

  const expected = EXPECTED_PLAN_AMOUNT_PAISE[planKey]
  const rz = getRazorpayClient()
  const raw = (await rz.plans.fetch(razorpayPlanId)) as RazorpayPlanEntity
  const amount = raw.item?.amount
  const currency = raw.item?.currency ?? 'INR'

  if (typeof amount !== 'number' || amount <= 0) {
    throw new Error(`Could not read amount for Razorpay plan ${razorpayPlanId}. Check the plan exists in your Razorpay mode (test vs live).`)
  }

  if (currency !== 'INR') {
    throw new Error(`Razorpay plan ${razorpayPlanId} uses ${currency}; only INR plans are supported.`)
  }

  if (amount !== expected) {
    const envNames: Record<RazorpayPlanKey, string> = {
      starter: 'RAZORPAY_PLAN_STARTER',
      growth: 'RAZORPAY_PLAN_GROWTH',
      scale: 'RAZORPAY_PLAN_SCALE',
      agency: 'RAZORPAY_PLAN_AGENCY',
      agency_addon: 'RAZORPAY_PLAN_AGENCY_ADDON',
    }
    throw new Error(
      `Razorpay plan mismatch for "${planKey}": ${envNames[planKey]}=${razorpayPlanId} charges ${formatInrFromPaise(amount)}/mo but ReviewsPulse expects ${formatInrFromPaise(expected)}/mo. In Razorpay Dashboard → Subscriptions → Plans, create a plan at ${formatInrFromPaise(expected)} and paste its plan id into ${envNames[planKey]}, then redeploy.`
    )
  }
}
