import { Resend } from 'resend'
import type { Types } from 'mongoose'
import { detectReviewLanguageIso1 } from '@/lib/language-detect'
import { translationContentFingerprint } from '@/lib/translation-fingerprint'
import { planAllowsKeywordAlerts, planAllowsMoodHeatmap, planAllowsVoiceWhatsAppReply, planAllowsWhatsApp } from '@/lib/plan-access'
import { classifyReviewEmotion } from '@/lib/review-emotion'
import { sendWhatsAppAlertWithOptionalContent } from '@/lib/twilio-whatsapp'
import { translateToEnglish } from '@/lib/translate-review'
import Location from '@/models/Location'
import Review from '@/models/Review'
import ReviewAlert from '@/models/ReviewAlert'
import User from '@/models/User'
import { enqueueZeroOneAfterSync } from '@/lib/review-zero-one'
import { setWhatsAppVoicePinForReview } from '@/lib/whatsapp-voice-reply'

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
  const unsetFields: Record<string, 1> = {}

  if (comment.length <= 10 || detected === 'en') {
    if (review.translatedText) {
      unsetFields.translatedText = 1
      unsetFields.translationSourceFingerprint = 1
    }
  } else {
    const fp = translationContentFingerprint(detected, comment)
    const already = Boolean(review.translatedText) && review.translationSourceFingerprint === fp
    if (!already) {
      const translated = await translateToEnglish(comment, detected, {
        userIdForQuota: String(review.userId),
      })
      if (translated) {
        setDoc.translatedText = translated
        setDoc.translationSourceFingerprint = fp
      }
    }
  }

  const update: { $set: typeof setDoc; $unset?: typeof unsetFields } = { $set: setDoc }
  if (Object.keys(unsetFields).length) update.$unset = unsetFields
  await Review.findByIdAndUpdate(review._id, update)

  const plan = user.plan as string

  if (planAllowsMoodHeatmap(plan) && comment.trim().length > 5 && !review.emotion) {
    try {
      const emotion = await classifyReviewEmotion(comment)
      if (emotion) {
        await Review.findByIdAndUpdate(review._id, { $set: { emotion } })
      }
    } catch (e) {
      console.warn('Emotion classification skipped:', e)
    }
  }

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
      const base = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
      const reviewUrl = `${base}/reviews?review=${String(review._id)}&openReply=1`
      const html = `<p>Keyword <strong>${kw.keyword}</strong> matched a new review (${review.rating}★).</p><p><a href="${reviewUrl}">Open inbox</a></p>`
      try {
        await sendEmailAlert(user.email, subject, html)
      } catch (e) {
        console.error('Keyword alert email failed:', e)
      }
      if (
        planAllowsWhatsApp(plan) &&
        user.whatsappNumber &&
        user.whatsappAlertsEnabled !== false
      ) {
        const allow = await incrementWhatsAppDailyCount(user._id as Types.ObjectId)
        if (allow) {
          const body = `${subject}\n\n"${comment.slice(0, 200)}"\n— ${review.reviewerName}\n\nOpen: ${reviewUrl}`
          await sendWhatsAppAlertWithOptionalContent(user.whatsappNumber, body)
        }
      }
    }
  }

  if (
    planAllowsWhatsApp(plan) &&
    user.whatsappNumber &&
    user.whatsappAlertsEnabled !== false &&
    review.rating <= 2 &&
    review.status === 'pending' &&
    !review.lowRatingWhatsAppNotified
  ) {
    const allow = await incrementWhatsAppDailyCount(user._id as Types.ObjectId)
    if (allow) {
      const base = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
      const reviewUrl = `${base}/reviews?review=${String(review._id)}&openReply=1`
      const msg = `🔴 New ${review.rating}⭐ review on ${location.name}

"${comment.slice(0, 200)}"
— ${review.reviewerName}

AI reply is ready. Tap to review & publish:
${reviewUrl}`
      const result = await sendWhatsAppAlertWithOptionalContent(user.whatsappNumber, msg)
      if (!result.error) {
        await Review.findByIdAndUpdate(review._id, { $set: { lowRatingWhatsAppNotified: true } })
        if (planAllowsVoiceWhatsAppReply(plan)) {
          try {
            await setWhatsAppVoicePinForReview(user._id as Types.ObjectId, review._id as Types.ObjectId)
          } catch (e) {
            console.warn('Voice pin for low-star alert skipped:', e)
          }
        }
      }
    }
  }

  enqueueZeroOneAfterSync(review._id as Types.ObjectId)
}
