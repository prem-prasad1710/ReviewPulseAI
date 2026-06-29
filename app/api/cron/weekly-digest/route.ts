import { err, ok } from '@/lib/api'
import { sendWeeklyDigestEmail } from '@/lib/email-weekly-digest'
import { connectDB } from '@/lib/mongodb'
import Location from '@/models/Location'
import Review from '@/models/Review'
import User from '@/models/User'

/** Vercel Cron invokes with GET; keep POST for manual / external triggers. */
export async function GET(request: Request) {
  return POST(request)
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const secret = process.env.CRON_SECRET
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return err('Unauthorized', 401)
    }

    await connectDB()

    const weekAgo = new Date(Date.now() - 7 * 86400000)
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000)
    const base = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')

    const users = await User.find({ email: { $exists: true, $ne: '' } })
      .select('_id email name plan')
      .limit(200)
      .lean()

    let sent = 0
    const errors: string[] = []

    for (const u of users) {
      if (!u.email) continue
      const locCount = await Location.countDocuments({ userId: u._id, isActive: true })
      if (locCount === 0) continue

      const primaryLoc = await Location.findOne({ userId: u._id, isActive: true })
        .select('name')
        .sort({ createdAt: 1 })
        .lean()

      const thisWeek = await Review.find({
        userId: u._id,
        reviewCreatedAt: { $gte: weekAgo },
      })
        .select('rating sentiment status reviewerName comment reviewCreatedAt')
        .lean()

      const lastWeek = await Review.find({
        userId: u._id,
        reviewCreatedAt: { $gte: twoWeeksAgo, $lt: weekAgo },
      })
        .select('rating')
        .lean()

      const avg = (arr: { rating: number }[]) =>
        arr.length ? arr.reduce((s, r) => s + r.rating, 0) / arr.length : 0

      const unanswered = await Review.find({
        userId: u._id,
        status: { $in: ['pending', 'scheduled'] },
      })
        .sort({ rating: 1, reviewCreatedAt: -1 })
        .limit(5)
        .select('reviewerName rating comment')
        .lean()

      const positive = thisWeek.filter((r) => r.sentiment === 'positive').length
      const negative = thisWeek.filter((r) => r.sentiment === 'negative').length
      const neutral = thisWeek.length - positive - negative

      try {
        const result = await sendWeeklyDigestEmail({
          to: u.email,
          businessName: primaryLoc?.name || u.name || 'Your business',
          totalReviews: thisWeek.length,
          avgRatingThisWeek: avg(thisWeek),
          avgRatingLastWeek: avg(lastWeek),
          positive,
          neutral: Math.max(0, neutral),
          negative,
          topUnanswered: unanswered.map((r) => ({
            reviewerName: r.reviewerName || 'Customer',
            rating: r.rating,
            comment: r.comment,
          })),
          dashboardUrl: `${base}/dashboard`,
        })
        if (result.ok) sent += 1
        else if (result.error) errors.push(`${u.email}: ${result.error}`)
      } catch (e) {
        errors.push(`${u.email}: ${(e as Error).message}`)
      }
    }

    return ok({ usersChecked: users.length, emailsSent: sent, errors: errors.slice(0, 10) })
  } catch (error) {
    console.error('POST weekly-digest failed:', error)
    return err('Cron failed', 500)
  }
}
