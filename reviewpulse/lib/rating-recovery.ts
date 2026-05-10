/** C1 — Rating recovery: monitor GBP for rating changes for 30 days after reply to low-star reviews. */

import type { Types } from 'mongoose'
import { planAllowsWhatsApp } from '@/lib/plan-access'
import { sendWhatsAppMessage } from '@/lib/twilio-whatsapp'
import Review from '@/models/Review'
import User from '@/models/User'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export function monitoringUntilForRating(rating: number): Date | undefined {
  if (rating <= 3) {
    return new Date(Date.now() + THIRTY_DAYS_MS)
  }
  return undefined
}

export type PriorReviewForRecovery = {
  rating?: number
  ratingMonitoringUntil?: Date | null
  ratingRecovered?: boolean | null
} | null

/** True when GBP shows a higher star count while we are still inside the monitoring window after a ≤3★ reply. */
export function shouldRecoverRating(
  prior: PriorReviewForRecovery,
  newRatingFromGbp: number,
  now: Date = new Date()
): boolean {
  if (!prior || prior.ratingRecovered) return false
  if (!prior.ratingMonitoringUntil || new Date(prior.ratingMonitoringUntil) <= now) return false
  const pr = typeof prior.rating === 'number' ? prior.rating : 0
  if (pr > 3) return false
  return newRatingFromGbp > pr
}

export async function markRatingRecoveredAndNotify(params: {
  reviewId: Types.ObjectId
  userId: Types.ObjectId
  locationName: string
  reviewerName: string
  oldRating: number
  newRating: number
}): Promise<void> {
  await Review.findByIdAndUpdate(params.reviewId, {
    $set: {
      ratingRecovered: true,
      ratingRecoveredAt: new Date(),
    },
    $unset: { ratingMonitoringUntil: '' },
  })

  const user = await User.findById(params.userId).select('plan whatsappNumber whatsappAlertsEnabled').lean()
  if (!user || !planAllowsWhatsApp(user.plan as string)) return
  if (!user.whatsappNumber || user.whatsappAlertsEnabled === false) return

  const base = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  const reviewUrl = `${base}/reviews?review=${String(params.reviewId)}&openReply=1`
  const msg = `⭐ Rating recovery on ${params.locationName}

${params.reviewerName} updated their review from ${params.oldRating}★ to ${params.newRating}★ after your reply.

Open: ${reviewUrl}`

  const result = await sendWhatsAppMessage(user.whatsappNumber, msg)
  if (result.error) {
    console.warn('Rating recovery WhatsApp failed:', result.error)
  }
}
