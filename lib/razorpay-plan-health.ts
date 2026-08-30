import { EXPECTED_PLAN_AMOUNT_PAISE } from '@/lib/razorpay-plan-validation'
import { isRazorpayInvalidIdError, parseRazorpayApiError } from '@/lib/razorpay-api-error'
import { getRazorpayClient, getRazorpayPlanId, type RazorpayPlanKey } from '@/lib/razorpay'

const PRIMARY_PLANS: RazorpayPlanKey[] = ['starter', 'growth', 'scale', 'agency']

const PLAN_ENV_VARS: Record<RazorpayPlanKey, string> = {
  starter: 'RAZORPAY_PLAN_STARTER',
  growth: 'RAZORPAY_PLAN_GROWTH',
  scale: 'RAZORPAY_PLAN_SCALE',
  agency: 'RAZORPAY_PLAN_AGENCY',
  agency_addon: 'RAZORPAY_PLAN_AGENCY_ADDON',
}

export type RazorpayPlanHealth = {
  plan: RazorpayPlanKey
  envVar: string
  planId: string
  ok: boolean
  amountPaise?: number
  expectedPaise: number
  error?: string
}

type RazorpayPlanEntity = {
  id?: string
  item?: { amount?: number; currency?: string }
}

/** Live-check each configured Razorpay subscription plan id (authenticated diagnostics). */
export async function checkRazorpayPlanHealth(plans: RazorpayPlanKey[] = PRIMARY_PLANS): Promise<RazorpayPlanHealth[]> {
  const rz = getRazorpayClient()
  const results: RazorpayPlanHealth[] = []

  for (const plan of plans) {
    const envVar = PLAN_ENV_VARS[plan]
    const expectedPaise = EXPECTED_PLAN_AMOUNT_PAISE[plan]

    let planId: string
    try {
      planId = getRazorpayPlanId(plan)
    } catch (e) {
      results.push({
        plan,
        envVar,
        planId: '',
        ok: false,
        expectedPaise,
        error: e instanceof Error ? e.message : 'Missing plan id',
      })
      continue
    }

    try {
      const raw = (await rz.plans.fetch(planId)) as RazorpayPlanEntity
      const amountPaise = raw.item?.amount
      const currency = raw.item?.currency ?? 'INR'

      if (typeof amountPaise !== 'number' || amountPaise <= 0) {
        results.push({
          plan,
          envVar,
          planId,
          ok: false,
          expectedPaise,
          error: `Plan exists but amount could not be read (check test vs live mode).`,
        })
        continue
      }

      if (currency !== 'INR') {
        results.push({
          plan,
          envVar,
          planId,
          ok: false,
          amountPaise,
          expectedPaise,
          error: `Plan uses ${currency}; only INR is supported.`,
        })
        continue
      }

      if (amountPaise !== expectedPaise) {
        results.push({
          plan,
          envVar,
          planId,
          ok: false,
          amountPaise,
          expectedPaise,
          error: `Plan charges ${amountPaise} paise/mo but app expects ${expectedPaise} paise/mo.`,
        })
        continue
      }

      results.push({ plan, envVar, planId, ok: true, amountPaise, expectedPaise })
    } catch (error) {
      const parsed = parseRazorpayApiError(error)
      const invalidId = isRazorpayInvalidIdError(error)
      results.push({
        plan,
        envVar,
        planId,
        ok: false,
        expectedPaise,
        error: invalidId
          ? `${envVar}=${planId} not found in Razorpay (wrong id or test/live mismatch).`
          : parsed?.description || (error instanceof Error ? error.message : 'Plan check failed'),
      })
    }
  }

  return results
}
