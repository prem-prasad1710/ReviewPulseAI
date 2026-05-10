import type { Types } from 'mongoose'
import { put } from '@vercel/blob'
import { buildMonthlyReportBuffer } from '@/lib/monthly-report-pdf'
import { planAllowsMonthlyPdfAuto } from '@/lib/plan-access'
import { REPORT_URL_EMAIL_ONLY } from '@/lib/reports/constants'
import { computeReputationScore, letterGrade } from '@/lib/score-compute'
import Location from '@/models/Location'
import Review from '@/models/Review'
import User from '@/models/User'

export type GenerateReportMode = 'manual' | 'cron'

export type GenerateMonthlyReportFailureCode = 'not_found' | 'rate_limited' | 'cron_already_this_month'

export type GenerateMonthlyReportOutcome =
  | {
      ok: true
      monthKey: string
      locationName: string
      pdfBuffer: Buffer
      /** Public Blob URL when uploaded; omitted when user downloads PDF directly (no Blob token). */
      url?: string
    }
  | { ok: false; code: GenerateMonthlyReportFailureCode }

/**
 * Build PDF, optionally upload to Vercel Blob, append to `location.reports` when a public URL exists.
 * - manual + Blob: upload + list entry + lastPdfReportAt.
 * - manual + no Blob: PDF only, lastPdfReportAt (rate limit); no list row.
 * - cron + Blob: upload + list; skip if month already in reports.
 * - cron + no Blob: list row with REPORT_URL_EMAIL_ONLY for dedup; email uses pdfBuffer.
 */
export async function generateMonthlyReportForLocation(
  locationId: Types.ObjectId,
  userId: Types.ObjectId,
  mode: GenerateReportMode
): Promise<GenerateMonthlyReportOutcome> {
  const location = await Location.findOne({ _id: locationId, userId })
  if (!location) return { ok: false, code: 'not_found' }

  const user = await User.findById(userId).select('plan').lean()
  if (!user) return { ok: false, code: 'not_found' }

  const monthKey = new Date().toISOString().slice(0, 7)

  if (mode === 'cron') {
    const hasMonth = (location.reports || []).some((r) => r.month === monthKey)
    if (hasMonth) return { ok: false, code: 'cron_already_this_month' }
  } else {
    const last = location.lastPdfReportAt?.getTime() ?? 0
    if (last && Date.now() - last < 86_400_000) return { ok: false, code: 'rate_limited' }
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

  if (token) {
    const key = `reports/${String(location._id)}/${Date.now()}.pdf`
    const blob = await put(key, pdfBuf, { access: 'public', token })

    await Location.findByIdAndUpdate(location._id, {
      $push: { reports: { month: monthKey, url: blob.url, generatedAt: new Date() } },
      $set: { lastPdfReportAt: new Date() },
    })

    return {
      ok: true,
      url: blob.url,
      monthKey,
      locationName: location.name,
      pdfBuffer: pdfBuf,
    }
  }

  if (mode === 'manual') {
    await Location.findByIdAndUpdate(location._id, {
      $set: { lastPdfReportAt: new Date() },
    })
    return { ok: true, monthKey, locationName: location.name, pdfBuffer: pdfBuf }
  }

  await Location.findByIdAndUpdate(location._id, {
    $push: { reports: { month: monthKey, url: REPORT_URL_EMAIL_ONLY, generatedAt: new Date() } },
    $set: { lastPdfReportAt: new Date() },
  })
  return { ok: true, monthKey, locationName: location.name, pdfBuffer: pdfBuf }
}
