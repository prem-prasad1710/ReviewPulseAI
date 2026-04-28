import type { Types } from 'mongoose'

export type Plan = 'free' | 'starter' | 'growth' | 'scale' | 'agency'
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due'

export interface IUserLean {
  _id: Types.ObjectId | string
  googleId: string
  email: string
  name: string
  image?: string
  plan: Plan
  whatsappNumber?: string
  whatsappAlertsEnabled?: boolean
  agencyId?: Types.ObjectId | string
  /** Extra location slots purchased via Razorpay add-on (agency plan). */
  agencyLocationAddons?: number
  razorpayCustomerId?: string
  razorpaySubscriptionId?: string
  subscriptionStatus: SubscriptionStatus
  trialEndsAt?: Date
  repliesUsedThisMonth: number
  repliesResetAt: Date
  createdAt: Date
  updatedAt: Date
}

export type ReplyLanguage = 'hindi' | 'english' | 'hinglish'
export type ReplyTone = 'professional' | 'friendly' | 'formal'

export interface SessionUser {
  id: string
  email: string
  name: string
  image?: string
}
