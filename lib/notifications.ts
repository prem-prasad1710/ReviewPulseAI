import type { Types } from 'mongoose'
import Notification, { type NotificationType } from '@/models/Notification'

export async function createNotification(params: {
  userId: string | Types.ObjectId
  type: NotificationType
  title: string
  body: string
  linkHref: string
  locationId?: string | Types.ObjectId
  reviewId?: string | Types.ObjectId
}): Promise<void> {
  try {
    await Notification.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      linkHref: params.linkHref,
      locationId: params.locationId,
      reviewId: params.reviewId,
      read: false,
    })
  } catch (e) {
    // Never let a notification creation crash the main flow
    console.error('createNotification failed:', e)
  }
}

/**
 * Create a batched notification for new reviews discovered during a sync.
 * Keeps noise low: one notification per sync batch (not one per review).
 */
export async function notifyNewReviews(params: {
  userId: string | Types.ObjectId
  locationId: string | Types.ObjectId
  locationName: string
  total: number
  negativeCount: number
}): Promise<void> {
  if (params.total === 0) return

  const hasNegative = params.negativeCount > 0
  const type: NotificationType = hasNegative ? 'recovery_urgent' : 'new_review'

  const title = hasNegative
    ? `${params.negativeCount} negative review${params.negativeCount > 1 ? 's' : ''} at ${params.locationName}`
    : `${params.total} new review${params.total > 1 ? 's' : ''} at ${params.locationName}`

  const body = hasNegative
    ? `You have ${params.negativeCount} unaddressed 1–2★ review${params.negativeCount > 1 ? 's' : ''}. Reply quickly to protect your rating.`
    : `${params.total} customer${params.total > 1 ? 's' : ''} left a review. Check your inbox and reply to keep the streak alive.`

  await createNotification({
    userId: params.userId,
    type,
    title,
    body,
    linkHref: '/reviews',
    locationId: params.locationId,
  })
}

export async function notifyCrisisAlert(params: {
  userId: string | Types.ObjectId
  locationId: string | Types.ObjectId
  locationName: string
  keyword: string
  reviewId?: string | Types.ObjectId
}): Promise<void> {
  await createNotification({
    userId: params.userId,
    type: 'crisis_alert',
    title: `Crisis keyword detected at ${params.locationName}`,
    body: `A review containing "${params.keyword}" was flagged. Respond within the hour.`,
    linkHref: '/reviews',
    locationId: params.locationId,
    reviewId: params.reviewId,
  })
}

export async function notifyVelocitySpike(params: {
  userId: string | Types.ObjectId
  locationId: string | Types.ObjectId
  locationName: string
  kind: 'negative_attack' | 'positive_surge' | 'volume_spike'
  count: number
}): Promise<void> {
  const isAttack = params.kind === 'negative_attack'
  await createNotification({
    userId: params.userId,
    type: 'velocity_spike',
    title: isAttack
      ? `⚠️ Negative review spike at ${params.locationName}`
      : `🚀 Review surge at ${params.locationName}`,
    body: isAttack
      ? `${params.count} low-rated reviews in the last 6 hours — possible coordinated attack.`
      : `${params.count} new positive reviews in 24 hours — perfect time to share on social!`,
    linkHref: '/reviews',
    locationId: params.locationId,
  })
}
