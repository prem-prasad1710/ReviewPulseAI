/**
 * Pure, zero-dependency constants for Razorpay plan display names.
 * Safe to import in 'use client' components.
 */
import type { RazorpayPlanKey } from '@/lib/razorpay'

export const RAZORPAY_PLAN_CHECKOUT_NAMES: Record<RazorpayPlanKey, string> = {
  starter: 'ReviewsPulse Starter',
  growth: 'ReviewsPulse Growth',
  scale: 'ReviewsPulse Scale',
  agency: 'ReviewsPulse Agency',
  agency_addon: 'ReviewsPulse Agency — extra location',
}
