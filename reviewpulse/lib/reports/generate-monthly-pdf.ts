import type { Types } from 'mongoose'
import { put } from '@vercel/blob'
import { buildMonthlyReportBuffer } from '@/lib/monthly-report-pdf'
import { planAllowsMonthlyPdfAuto } from '@/lib/plan-access'
import { computeReputationScore, letterGrade } from '@/lib/score-compute'
import Location from '@/models/Location'
import Review from '@/models/Review'
import User from '@/models/User'

export type GenerateReportMode = 'manual' | 'cron'

export interface GenerateMonthlyReportResult {
  url: string
  monthKey: string
  locationName: string
  pdfBuffer: Buffer
}

/**
 * Build PDF, upload to Blob, append to location.reports.
 * - manual: enforces lastPdfReportAt (1/day) for same user flows.
 * - cron: skips daily limit; skips if reports already contains current YYYY-MM.
 */
export async function generateMonthlyReportForLocation(
  locationId: Types.ObjectId,
  userId: Types.ObjectId,
  mode: GenerateReportMode
): Promise<GenerateMonthlyReportResult | null> {
  const location = await Location.findOne({ _id: locationId, userId })
  if (!location) return null

  const user = await User.findById(userId).select('plan').lean()
  if (!user) return null

  const monthKey = new Date().toISOString().slice(0, 7)

  if (mode === 'cron') {
    const hasMonth = (location.reports || []).some((r) => r.month === monthKey)
    if (hasMonth) return null
  } else {
    const last = location.lastPdfReportAt?.getTime() ?? 0
    if (last && Date.now() - last < 86_400_000) return null
  }

  const reviews = await Review.find({ locationId: location._id, userId }).lean()
  const total = reviews.length
  const replied = reviews.filter((r) => r.status === 'replied').length
  const replyRate = total > 0 ? replied / total : 0
  const positive = reviews.filter((r) => r.sentiment === 'positive').length
  const positiveRatio = total > 0 ? positive / total : 0
  const avgRating =
    total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : location.averageRating || 0
  const score = computeReputationScore({
    averageRating: avgRating,
    replyRate,
    positiveRatio,
  })
  const grade = letterGrade(score)

  const monthLabel = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date())
  const summary = [
    `Reputation score ${score} (${grade}) based on rating, reply rate, and sentiment.`,
    `Reply rate ${Math.round(replyRate * 100)}% across ${total} synced reviews.`,
    planAllowsMonthlyPdfAuto(user.plan as string)
      ? 'Automated monthly report (Scale).'
      : 'Monthly reputation snapshot.',
  ]
  const statsLines = [
    `Total reviews: ${total}`,
    `Replied: ${replied}`,
    `Average rating: ${avgRating.toFixed(2)} / 5`,
    `Positive sentiment: ${positive} (${Math.round(positiveRatio * 100)}%)`,
  ]

  const pdfBuf = await buildMonthlyReportBuffer({
    businessName: location.name,
    monthLabel,
    score,
    grade,
    executiveSummary: summary,
    statsLines,
  })

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    console.error('generate-monthly-pdf: BLOB_READ_WRITE_TOKEN missing')
    return null
  }

  const key = `reports/${String(location._id)}/${Date.now()}.pdf`
  const blob = await put(key, pdfBuf, { access: 'public', token })

  await Location.findByIdAndUpdate(location._id, {
    $push: { reports: { month: monthKey, url: blob.url, generatedAt: new Date() } },
    $set: { lastPdfReportAt: new Date() },
  })

  return { url: blob.url, monthKey, locationName: location.name, pdfBuffer: pdfBuf }
}
