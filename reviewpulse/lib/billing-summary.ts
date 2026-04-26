import { connectDB } from '@/lib/mongodb'
import { getRazorpayClient } from '@/lib/razorpay'
import Subscription from '@/models/Subscription'
import User from '@/models/User'

export type BillingSummary = {
  customerId: string | null
  primarySubscriptionId: string | null
  plan: string
  subscriptionStatus: string | undefined
  primaryLive: {
    status: string
    short_url?: string
    current_start?: number
    current_end?: number
  } | null
  subscriptions: Array<{
    id: string
    razorpaySubscriptionId: string
    plan: string
    status: string
    paidCount: number
    createdAt: string
  }>
  dashboardLinks: {
    home: string
    subscriptionsIndex: string
    primarySubscription?: string
  }
}

const DEFAULT_DASHBOARD = 'https://dashboard.razorpay.com'

export async function getBillingSummary(userId: string): Promise<BillingSummary | null> {
  await connectDB()
  const u = await User.findById(userId)
    .select('razorpayCustomerId razorpaySubscriptionId plan subscriptionStatus')
    .lean()
  if (!u) return null

  const subs = await Subscription.find({ userId })
    .sort({ createdAt: -1 })
    .limit(25)
    .lean()

  let primaryLive: BillingSummary['primaryLive'] = null
  if (u.razorpaySubscriptionId && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
      const rz = getRazorpayClient()
      const live = (await rz.subscriptions.fetch(u.razorpaySubscriptionId)) as {
        status: string
        short_url?: string
        current_start?: number
        current_end?: number
      }
      primaryLive = {
        status: live.status,
        short_url: live.short_url,
        current_start: live.current_start,
        current_end: live.current_end,
      }
    } catch {
      primaryLive = null
    }
  }

  const base = (process.env.RAZORPAY_DASHBOARD_BASE_URL || DEFAULT_DASHBOARD).replace(/\/$/, '')

  return {
    customerId: u.razorpayCustomerId ?? null,
    primarySubscriptionId: u.razorpaySubscriptionId ?? null,
    plan: (u.plan as string) || 'free',
    subscriptionStatus: u.subscriptionStatus,
    primaryLive,
    subscriptions: subs.map((s) => ({
      id: String(s._id),
      razorpaySubscriptionId: s.razorpaySubscriptionId,
      plan: s.plan,
      status: s.status,
      paidCount: s.paidCount ?? 0,
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : '',
    })),
    dashboardLinks: {
      home: base,
      subscriptionsIndex: `${base}/app/subscriptions`,
      ...(u.razorpaySubscriptionId
        ? { primarySubscription: `${base}/app/subscriptions/${u.razorpaySubscriptionId}` }
        : {}),
    },
  }
}
