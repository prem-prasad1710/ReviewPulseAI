import { err, ok } from '@/lib/api'
import { connectDB } from '@/lib/mongodb'
import { getCurrentFestival } from '@/lib/festivals'
import { planAllowsWhatsApp } from '@/lib/plan-access'
import { sendWhatsAppMessage } from '@/lib/twilio-whatsapp'
import Location from '@/models/Location'
import Review from '@/models/Review'
import User from '@/models/User'
import mongoose from 'mongoose'

/** B2 weekly review-request + B3 occasional festival WhatsApp (cron). */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const secret = process.env.CRON_SECRET
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return err('Unauthorized', 401)
    }
    await connectDB()

    let sent = 0
    const locs = await Location.find({ isActive: true, 'reviewRequestAutomation.enabled': true })
      .select('userId name reviewRequestAutomation')
      .limit(35)
      .lean()

    for (const loc of locs) {
      const uid = loc.userId as mongoose.Types.ObjectId
      const user = await User.findById(uid).select('plan whatsappNumber whatsappAlertsEnabled').lean()
      if (!user || !planAllowsWhatsApp(user.plan as string)) continue
      if (!user.whatsappNumber || user.whatsappAlertsEnabled === false) continue

      const auto = loc.reviewRequestAutomation as { enabled?: boolean; bodyTemplate?: string; lastRunAt?: Date } | undefined
      const last = auto?.lastRunAt ? new Date(auto.lastRunAt) : null
      const weekAgo = Date.now() - 7 * 86400000
      if (last && last.getTime() > weekAgo) continue

      const body =
        auto?.bodyTemplate?.trim() ||
        `ReviewPulse — gentle reminder: if you enjoyed ${loc.name}, a quick Google review helps neighbours choose us. Thank you!`
      const r = await sendWhatsAppMessage(user.whatsappNumber, body.slice(0, 1500))
      if (!r.error) {
        sent += 1
        await Location.findByIdAndUpdate(loc._id, {
          $set: { 'reviewRequestAutomation.lastRunAt': new Date() },
        })
      }
    }

    const festival = getCurrentFestival()
    if (festival) {
      const users = await User.find({
        whatsappNumber: { $exists: true, $ne: '' },
        plan: { $in: ['starter', 'growth', 'scale', 'agency'] },
      })
        .select('_id whatsappNumber superFanFestivalSentAt')
        .limit(40)
        .lean()

      for (const u of users) {
        const lastT = u.superFanFestivalSentAt ? new Date(u.superFanFestivalSentAt).getTime() : 0
        if (Date.now() - lastT < 24 * 86400000) continue

        const anyLoc = await Location.findOne({ userId: u._id, isActive: true }).select('name _id').lean()
        if (!anyLoc) continue
        const fiveStars = await Review.countDocuments({
          locationId: anyLoc._id,
          rating: { $gte: 5 },
        })
        if (fiveStars < 5) continue

        const msg = `${festival.greeting}! From ${anyLoc.name} — thanks for the love on Google reviews. Wishing you a wonderful ${festival.name}. — Team (ReviewPulse)`
        const r2 = await sendWhatsAppMessage(u.whatsappNumber!, msg)
        if (!r2.error) {
          await User.findByIdAndUpdate(u._id, { $set: { superFanFestivalSentAt: new Date() } })
          sent += 1
        }
      }
    }

    return ok({ reviewRequestLocations: locs.length, messagesSent: sent })
  } catch (e) {
    console.error('v2-campaigns cron', e)
    return err('Cron failed', 500)
  }
}

export async function GET(request: Request) {
  return POST(request)
}
