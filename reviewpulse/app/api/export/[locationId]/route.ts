import mongoose from 'mongoose'
import { err } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { planAllowsDataExport } from '@/lib/plan-access'
import Location from '@/models/Location'
import Review from '@/models/Review'

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET(_request: Request, { params }: { params: Promise<{ locationId: string }> }) {
  try {
    const user = await requireAuth()
    const plan = (user.plan as string) || 'free'
    if (!planAllowsDataExport(plan)) {
      return err('CSV export requires a paid plan (Starter+).', 403)
    }

    const { locationId } = await params
    if (!mongoose.isValidObjectId(locationId)) {
      return err('Invalid location', 400)
    }

    await connectDB()
    const location = await Location.findOne({
      _id: new mongoose.Types.ObjectId(locationId),
      userId: user._id,
      isActive: true,
    })
      .select('name locationSlug')
      .lean()
    if (!location) return err('Location not found', 404)

    const reviews = await Review.find({
      locationId: location._id,
      userId: user._id,
    })
      .sort({ reviewCreatedAt: -1 })
      .select(
        'googleReviewId reviewerName rating comment sentiment emotion status reviewCreatedAt repliedAt publishedReply aiGeneratedReply'
      )
      .lean()

    const headers = [
      'googleReviewId',
      'reviewerName',
      'rating',
      'comment',
      'sentiment',
      'emotion',
      'status',
      'reviewCreatedAt',
      'repliedAt',
      'publishedReply',
      'aiGeneratedReply',
    ]
    const lines = [headers.join(',')]
    for (const r of reviews) {
      lines.push(
        [
          csvCell(r.googleReviewId),
          csvCell(r.reviewerName),
          csvCell(r.rating),
          csvCell(r.comment),
          csvCell(r.sentiment),
          csvCell((r as { emotion?: string }).emotion),
          csvCell(r.status),
          csvCell(r.reviewCreatedAt ? new Date(r.reviewCreatedAt).toISOString() : ''),
          csvCell(r.repliedAt ? new Date(r.repliedAt).toISOString() : ''),
          csvCell(r.publishedReply),
          csvCell(r.aiGeneratedReply),
        ].join(',')
      )
    }

    const slug = (location as { locationSlug?: string }).locationSlug || String(location._id)
    const csv = lines.join('\n')
    const filename = `reviewpulse-reviews-${slug}.csv`

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('GET export failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Export failed', 500)
  }
}
