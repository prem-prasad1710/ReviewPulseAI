import { toast } from 'sonner'

/** Single toast slot for checkout — prevents stuck duplicate loading toasts. */
export const CHECKOUT_TOAST_ID = 'reviewpulse-razorpay-checkout'

export function clearCheckoutToast() {
  toast.dismiss(CHECKOUT_TOAST_ID)
}

export function showCheckoutLoading(message: string) {
  clearCheckoutToast()
  toast.loading(message, { id: CHECKOUT_TOAST_ID })
}

export function showCheckoutSuccess(message: string) {
  clearCheckoutToast()
  toast.success(message, { id: CHECKOUT_TOAST_ID })
}

export function showCheckoutError(message: string, durationMs = 8000) {
  clearCheckoutToast()
  toast.error(message, { id: CHECKOUT_TOAST_ID, duration: durationMs })
}
