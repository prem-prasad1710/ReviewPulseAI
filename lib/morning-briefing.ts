/**
 * Morning Briefing — WhatsApp message sent at 9 AM IST (3:30 AM UTC) to all users
 * who have WhatsApp configured and morning briefing enabled (default: on).
 *
 * Message covers the last 24 hours: new reviews, avg rating, pending count,
 * worst review snippet, and a direct inbox link.
 */

import { sendWhatsAppAlertWithOptionalContent } from '@/lib/twilio-whatsapp'
import { planAllowsWhatsApp } from '@/lib/plan-access'
import { getEffectivePlan } from '@/lib/trial'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Review from '@/models/Review'
import Location from '@/models/Location'
import ReviewAlert from '@/models/ReviewAlert'

type MorningBriefingResult = {
  userId: string
  sent: boolean
  error?: string
}

function ratingStars(n: number): string {
  return '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))
}

function shortSnippet(comment?: string, maxLen = 80): string {
  if (!comment) return ''
  const clean = comment.replace(/\n+/g, ' ').trim()
  return clean.length > maxLen ? clean.slice(0, maxLen) + '…' : clean
}

export async function sendMorningBriefingToUser(userId: string): Promise<MorningBriefingResult> {
  await connectDB()
  const user = await User.findById(userId)
    .select('whatsappNumber whatsappAlertsEnabled morningBriefingEnabled plan trialEndsAt subscriptionStatus')
    .lean()

  if (!user?.whatsappNumber) return { userId, sent: false, error: 'no_whatsapp' }
  if (user.morningBriefingEnabled === false) return { userId, sent: false, error: 'disabled' }
  if (user.whatsappAlertsEnabled === false) return { userId, sent: false, error: 'alerts_disabled' }

  const plan = getEffectivePlan(user as Parameters<typeof getEffectivePlan>[0])
  if (!planAllowsWhatsApp(plan)) return { userId, sent: false, error: 'plan' }

  const since24h = new Date(Date.now() - 24 * 3600_000)
  const base = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')

  const [newReviews, pending, primaryLoc, crisisCount] = await Promise.all([
    Review.find({ userId, reviewCreatedAt: { $gte: since24h } })
      .select('rating sentiment comment reviewerName')
      .lean(),
    Review.countDocuments({ userId, status: { $in: ['pending'] } }),
    Location.findOne({ userId, isActive: true })
      .select('name')
      .sort({ createdAt: 1 })
      .lean(),
    ReviewAlert.countDocuments({
      userId,
      type: 'crisis',
      createdAt: { $gte: since24h },
    }),
  ])

  const locName = primaryLoc?.name || 'your business'
  const newCount = newReviews.length
  const avgRating =
    newCount > 0
      ? newReviews.reduce((s, r) => s + r.rating, 0) / newCount
      : null

  const worstReview = newReviews.length > 0
    ? newReviews.sort((a, b) => a.rating - b.rating)[0]
    : null

  const inboxUrl = `${base}/reviews`
  const dashUrl = `${base}/dashboard`

  // Build message
  const lines: string[] = []
  lines.push(`🌅 *Good morning, ${locName}!*`)
  lines.push(`Here's your ReviewPulse overnight summary:\n`)

  if (newCount === 0) {
    lines.push(`📭 No new reviews in the last 24 hours.`)
  } else {
    lines.push(`📬 *${newCount} new review${newCount > 1 ? 's' : ''}* overnight`)
    if (avgRating !== null) {
      lines.push(`⭐ Average: *${avgRating.toFixed(1)}* ${ratingStars(avgRating)}`)
    }
  }

  lines.push(``)
  lines.push(`📋 *${pending} review${pending !== 1 ? 's' : ''} waiting for your reply*`)

  if (crisisCount > 0) {
    lines.push(`🚨 *${crisisCount} crisis keyword${crisisCount > 1 ? 's' : ''} flagged* — check now!`)
  }

  if (worstReview && worstReview.rating <= 3 && worstReview.comment) {
    lines.push(`\n⚠️ *Needs attention (${worstReview.rating}★):*`)
    lines.push(`_"${shortSnippet(worstReview.comment)}"_`)
    lines.push(`— ${worstReview.reviewerName}`)
  }

  lines.push(`\n👉 Inbox: ${inboxUrl}`)
  lines.push(`📊 Dashboard: ${dashUrl}`)
  lines.push(`\n_Reply STOP to turn off morning briefing._`)

  const body = lines.join('\n')

  const result = await sendWhatsAppAlertWithOptionalContent(user.whatsappNumber, body)
  if (result.error) return { userId, sent: false, error: result.error }

  return { userId, sent: true }
}

export async function sendMorningBriefingToAllUsers(): Promise<{
  usersChecked: number
  sent: number
  errors: string[]
}> {
  await connectDB()

  const users = await User.find({
    whatsappNumber: { $exists: true, $ne: '' },
    whatsappAlertsEnabled: { $ne: false },
    morningBriefingEnabled: { $ne: false },
  })
    .select('_id')
    .limit(500)
    .lean()

  let sent = 0
  const errors: string[] = []

  for (const u of users) {
    const result = await sendMorningBriefingToUser(String(u._id))
    if (result.sent) sent++
    else if (result.error && !['no_whatsapp', 'disabled', 'plan', 'alerts_disabled'].includes(result.error)) {
      errors.push(`${u._id}: ${result.error}`)
    }
  }

  return { usersChecked: users.length, sent, errors }
}
