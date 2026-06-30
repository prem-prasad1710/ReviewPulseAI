import type { Types } from 'mongoose'
import Review from '@/models/Review'
import Location from '@/models/Location'
import User from '@/models/User'
import { sendWhatsAppAlertWithOptionalContent } from '@/lib/twilio-whatsapp'
import { planAllowsWhatsApp } from '@/lib/plan-access'
import { getEffectivePlan } from '@/lib/trial'

export type SpikeKind = 'negative_attack' | 'positive_surge' | 'volume_spike'

export type VelocitySpike = {
  locationId: string
  locationName: string
  kind: SpikeKind
  reviewCount: number
  windowHours: number
  avgRating: number
  detectedAt: Date
}

/**
 * After each sync, check if a spike happened in the last N hours for this location.
 * A spike is:
 *   - 3+ new reviews in 24 h (volume spike)
 *   - 2+ new ≤2★ reviews in 6 h (negative attack)
 *   - 4+ new ≥4★ reviews in 24 h (positive surge — great for social proof)
 */
export async function detectVelocitySpike(
  locationMongoId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<VelocitySpike | null> {
  const now = new Date()
  const h24 = new Date(now.getTime() - 24 * 3600_000)
  const h6 = new Date(now.getTime() - 6 * 3600_000)

  const recent24 = await Review.find({
    locationId: locationMongoId,
    reviewCreatedAt: { $gte: h24 },
  })
    .select('rating reviewCreatedAt')
    .lean()

  if (recent24.length === 0) return null

  const recent6neg = recent24.filter(
    (r) => r.rating <= 2 && new Date(r.reviewCreatedAt).getTime() >= h6.getTime()
  )

  const avg24 = recent24.reduce((s, r) => s + r.rating, 0) / recent24.length

  let kind: SpikeKind | null = null
  let count = 0
  let windowHours = 24

  if (recent6neg.length >= 2) {
    kind = 'negative_attack'
    count = recent6neg.length
    windowHours = 6
  } else if (recent24.length >= 3 && avg24 < 3.0) {
    kind = 'volume_spike'
    count = recent24.length
    windowHours = 24
  } else if (recent24.filter((r) => r.rating >= 4).length >= 4) {
    kind = 'positive_surge'
    count = recent24.filter((r) => r.rating >= 4).length
    windowHours = 24
  }

  if (!kind) return null

  const location = await Location.findById(locationMongoId).select('name').lean()
  if (!location) return null

  return {
    locationId: String(locationMongoId),
    locationName: location.name,
    kind,
    reviewCount: count,
    windowHours,
    avgRating: Math.round(avg24 * 10) / 10,
    detectedAt: now,
  }
}

export async function notifySpikeViaWhatsApp(
  spike: VelocitySpike,
  userId: string | Types.ObjectId
): Promise<void> {
  const user = await User.findById(userId).select('whatsappNumber whatsappAlertsEnabled plan trialEndsAt subscriptionStatus').lean()
  if (!user?.whatsappNumber || user.whatsappAlertsEnabled === false) return

  const plan = getEffectivePlan(user as Parameters<typeof getEffectivePlan>[0])
  if (!planAllowsWhatsApp(plan)) return

  const base = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  const inboxUrl = `${base}/reviews?locationId=${spike.locationId}`

  let body = ''
  if (spike.kind === 'negative_attack') {
    body = `🚨 *Review Attack Alert* — ${spike.reviewCount} negative reviews (≤2★) hit *${spike.locationName}* in the last ${spike.windowHours}h.\n\nAct fast — reply before they damage your ranking.\n\n👉 Open inbox: ${inboxUrl}`
  } else if (spike.kind === 'positive_surge') {
    body = `🌟 *Review Surge!* — ${spike.reviewCount} positive reviews (≥4★) arrived at *${spike.locationName}* in 24h. Your reputation is on fire 🔥\n\nShare the momentum on social media.\n\n👉 View: ${inboxUrl}`
  } else {
    body = `📈 *Volume Spike* — ${spike.reviewCount} new reviews in 24h at *${spike.locationName}* (avg ${spike.avgRating}★). Something is driving unusual activity.\n\n👉 Check inbox: ${inboxUrl}`
  }

  await sendWhatsAppAlertWithOptionalContent(user.whatsappNumber, body)
}
