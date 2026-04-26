import type { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { getRazorpayClient } from '@/lib/razorpay'
import User from '@/models/User'

type RazorpayCustomer = { id: string }

function displayNameForRazorpay(raw: string | undefined): string {
  let name = (raw || '').trim() || 'ReviewPulse customer'
  if (name.length < 3) name = 'ReviewPulse customer'
  if (name.length > 50) name = name.slice(0, 50)
  return name
}

/**
 * Ensures the user has a Razorpay customer id (creates or reuses by email).
 * Uses `fail_existing: 0` so Razorpay returns the existing customer when email matches.
 */
export async function ensureRazorpayCustomerId(userId: Types.ObjectId): Promise<string> {
  await connectDB()
  const user = await User.findById(userId)
  if (!user) throw new Error('USER_NOT_FOUND')
  if (user.razorpayCustomerId) return user.razorpayCustomerId
  if (!user.email?.trim()) throw new Error('USER_EMAIL_REQUIRED')

  const rz = getRazorpayClient()
  const created = (await rz.customers.create({
    name: displayNameForRazorpay(user.name),
    email: user.email.trim(),
    fail_existing: 0,
    notes: { appUserId: String(user._id) },
  })) as RazorpayCustomer

  if (!created?.id) throw new Error('RAZORPAY_CUSTOMER_CREATE_FAILED')

  user.razorpayCustomerId = created.id
  await user.save()
  return created.id
}
