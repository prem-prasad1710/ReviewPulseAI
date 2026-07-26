/** User-facing message for Razorpay `payment.failed` / checkout errors. */
export function formatRazorpayPaymentError(raw: string | undefined): string {
  const message = (raw || '').trim()
  const lower = message.toLowerCase()

  if (lower.includes('international card')) {
    return [
      'This Razorpay account does not accept international cards.',
      'In Test mode, pay with UPI (success@razorpay) or an Indian test card (5267 3181 8797 5449).',
      'For foreign cards in production, enable International Payments in Razorpay Dashboard → Payment Methods.',
    ].join(' ')
  }

  if (lower.includes('card issuer is invalid') || lower.includes('invalid card')) {
    return 'That card cannot be used in Test mode. Try UPI success@razorpay or Razorpay’s Indian test card 5267 3181 8797 5449.'
  }

  return message || 'Payment failed. Please try again or use a different method.'
}

export function isRazorpayTestKey(keyId: string | undefined): boolean {
  return Boolean(keyId?.trim().startsWith('rzp_test_'))
}
