import { Resend } from 'resend'
import type { Types } from 'mongoose'
import { detectReviewLanguageIso1 } from '@/lib/language-detect'
import { planAllowsKeywordAlerts, planAllowsWhatsApp } from '@/lib/plan-access'
import { sendWhatsAppMessage } from '@/lib/twilio-whatsapp'
import { translateToEnglish } from '@/lib/translate-review'
import Location from '@/models/Location'
import Review from '@/models/Review'
import ReviewAlert from '@/models/ReviewAlert'
import User from '@/models/User'

const MAX_WHATSAPP_ALERTS_PER_DAY = 10

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

async function incrementWhatsAppDailyCount(userId: Types.ObjectId): Promise<boolean> {
  const day = utcDayKey(new Date())
  const user = await User.findById(userId).select('whatsappAlertsDayKey whatsappAlertsSent').lean()
  if (!user) return false
  const key = user.whatsappAlertsDayKey
  const sent = user.whatsappAlertsSent ?? 0
  if (key !== day) {
    await User.findByIdAndUpdate(userId, {
      $set: { whatsappAlertsDayKey: day, whatsappAlertsSent: 1 },
    })
    return true
  }
  if (sent >= MAX_WHATSAPP_ALERTS_PER_DAY) return false
  await User.findByIdAndUpdate(userId, { $inc: { whatsappAlertsSent: 1 } })
  return true
}

async function sendEmailAlert(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.FROM_EMAIL || 'onboarding@resend.dev'
  if (!key) {
    console.error('ReviewAlert email: RESEND_API_KEY missing')
    return
  }
  const resend = new Resend(key)
  await resend.emails.send({ from, to, subject, html })
}

export async function processReviewAfterSync(reviewDbId: Types.ObjectId): Promise<void> {
  const review = await Review.findById(reviewDbId)
  if (!review) return

  const [location, user] = await Promise.all([
    Location.findById(review.locationId).lean(),
    User.findById(review.userId).lean(),
  ])
  if (!location || !user) return

  const comment = review.comment || ''
  const detected = detectReviewLanguageIso1(comment)
  const setDoc: Record<string, string> = { detectedLanguage: detected }
  if (detected !== 'en' && comment.length > 10) {
    const translated = await translateToEnglish(comment, detected)
    if (translated) setDoc.translatedText = translated
  }
  await Review.findByIdAndUpdate(review._id, { $set: setDoc })

  const plan = user.plan as string
  const commentLower = comment.toLowerCase()

  if (planAllowsKeywordAlerts(plan) && location.alertKeywords?.length) {
    for (const kw of location.alertKeywords) {
      if (kw.enabled === false) continue
      if (!commentLower.includes(String(kw.keyword).toLowerCase())) continue
      const exists = await ReviewAlert.findOne({
        reviewId: review._id,
        keyword: kw.keyword,
      }).lean()
      if (exists) continue
      await ReviewAlert.create({
        locationId: review.locationId,
        reviewId: review._id,
        userId: review.userId,
        keyword: kw.keyword,
        type: kw.type,
        notifiedAt: new Date(),
      })
      const subject =
        kw.type === 'crisis'
          ? `🚨 Crisis alert: "${kw.keyword}" mentioned in a new review — ${location.name}`
          : `✨ "${kw.keyword}" in a new review — ${location.name}`
      const html = `<p>Keyword <strong>${kw.keyword}</strong> matched a new review (${review.rating}★).</p><p><a href="${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || ''}/reviews">Open inbox</a></p>`
      try {
        await sendEmailAlert(user.email, subject, html)
      } catch (e) {
        console.error('Keyword alert email failed:', e)
      }
      if (planAllowsWhatsApp(plan) && user.whatsappNumber) {
        const allow = await incrementWhatsAppDailyCount(user._id as Types.ObjectId)
        if (allow) {
          const body = `${subject}\n\n"${comment.slice(0, 200)}"\n— ${review.reviewerName}`
          await sendWhatsAppMessage(user.whatsappNumber, body)
        }
      }
    }
  }

  if (
    planAllowsWhatsApp(plan) &&
    user.whatsappNumber &&
    review.rating <= 2 &&
    review.status === 'pending' &&
    !review.lowRatingWhatsAppNotified
  ) {
    const allow = await incrementWhatsAppDailyCount(user._id as Types.ObjectId)
    if (allow) {
      const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || ''
      const msg = `🔴 New ${review.rating}⭐ review on ${location.name}

"${comment.slice(0, 200)}"
— ${review.reviewerName}

AI reply is ready. Tap to review & publish:
${base}/reviews`
      const result = await sendWhatsAppMessage(user.whatsappNumber, msg)
      if (!result.error) {
        await Review.findByIdAndUpdate(review._id, { $set: { lowRatingWhatsAppNotified: true } })
      }
    }
  }
}
