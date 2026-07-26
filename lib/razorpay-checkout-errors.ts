/** User-facing message for Razorpay `payment.failed` / checkout errors. */
export function formatRazorpayPaymentError(raw: string | undefined): string {
  const message = (raw || '').trim()
  const lower = message.toLowerCase()

  if (lower.includes('international card')) {
    return 'This payment method is not supported. Please use an Indian-issued card, UPI, or net banking.'
  }

  if (lower.includes('card issuer is invalid') || lower.includes('invalid card')) {
    return 'This card could not be processed. Please try UPI, net banking, or a different card.'
  }

  return message || 'Payment could not be completed. Please try again or use a different payment method.'
}

export function isRazorpayTestKey(keyId: string | undefined): boolean {
  return Boolean(keyId?.trim().startsWith('rzp_test_'))
}
