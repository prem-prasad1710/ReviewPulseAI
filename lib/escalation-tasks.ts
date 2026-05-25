import type { Types } from 'mongoose'
import EscalationTask from '@/models/EscalationTask'

const SEVERE_PATTERN =
  /\b(food\s*poison|poisoning|hospital|lawsuit|legal\s*action|police|fraud|scam\b|salmonella|tamper|roach|worm|blood|unsafe)/i

function buildReason(rating: number, comment: string): string {
  if (rating <= 2 && SEVERE_PATTERN.test(comment)) {
    return 'Critical: low rating plus safety/compliance cues in review text.'
  }
  if (rating <= 2) {
    return 'Low star rating requires manager attention.'
  }
  return 'Automated escalation rule matched.'
}

/**
 * Creates an open escalation task when rating ≤ 2 or severe keywords appear (PDF escalation flows).
 */
export async function maybeCreateEscalationFromReview(opts: {
  reviewId: Types.ObjectId
  userId: Types.ObjectId
  locationId: Types.ObjectId
  rating: number
  comment?: string | null
  isNewReview: boolean
}): Promise<void> {
  if (!opts.isNewReview) return
  const c = opts.comment || ''
  const needs = opts.rating <= 2 || SEVERE_PATTERN.test(c)
  if (!needs) return

  const exists = await EscalationTask.findOne({ reviewId: opts.reviewId }).lean()
  if (exists) return

  const reason = buildReason(opts.rating, c)
  const priority = SEVERE_PATTERN.test(c) || opts.rating === 1 ? 'high' : 'medium'

  await EscalationTask.create({
    userId: opts.userId,
    locationId: opts.locationId,
    reviewId: opts.reviewId,
    status: 'open',
    actionType: 'resolve',
    reason,
    priority,
  })

  const slackUrl = process.env.ESCALATION_SLACK_WEBHOOK_URL?.trim()
  if (slackUrl) {
    try {
      const base = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
      const link = `${base}/reviews?review=${String(opts.reviewId)}&openReply=1`
      await fetch(slackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🔔 *ReviewPulse escalation* — ${priority.toUpperCase()}\n${reason}\nStars: ${opts.rating}\n<${link}|Open inbox>`,
        }),
        signal: AbortSignal.timeout(6000),
      })
    } catch (e) {
      console.warn('Slack escalation webhook failed:', e)
    }
  }
}
