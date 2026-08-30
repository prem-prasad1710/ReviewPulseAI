type RazorpayErrorBody = {
  statusCode?: number
  error?: {
    code?: string
    description?: string
    field?: string
  }
}

/** Normalize Razorpay Node SDK rejection payloads for logging and user messages. */
export function parseRazorpayApiError(error: unknown): {
  statusCode?: number
  code?: string
  description?: string
  field?: string
} | null {
  if (!error || typeof error !== 'object') return null

  const body = error as RazorpayErrorBody
  if (typeof body.statusCode === 'number' || body.error) {
    return {
      statusCode: body.statusCode,
      code: body.error?.code,
      description: body.error?.description,
      field: body.error?.field,
    }
  }

  return null
}

export function isRazorpayInvalidIdError(error: unknown): boolean {
  const parsed = parseRazorpayApiError(error)
  if (!parsed) return false
  const description = (parsed.description || '').toLowerCase()
  return (
    parsed.code === 'BAD_REQUEST_ERROR' &&
    (description.includes('invalid') || description.includes('could not be found'))
  )
}

export function razorpayInvalidPlanIdMessage(planKey: string, envVar: string, planId: string): string {
  return (
    `Razorpay plan "${planKey}" is misconfigured: ${envVar}=${planId} was not found in your Razorpay account. ` +
    'In Razorpay Dashboard (same mode as RAZORPAY_KEY_ID — test vs live), go to Subscriptions → Plans, create the plan at the correct monthly INR amount, paste the plan_… id into Vercel, and redeploy.'
  )
}
