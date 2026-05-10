import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { err } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { buildInvestorReportBuffer } from '@/lib/investor-report-pdf'
import { planAllowsInvestorReportPdf } from '@/lib/plan-access'
import Location from '@/models/Location'
import Review from '@/models/Review'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const plan = String(user.plan || '')
    if (!planAllowsInvestorReportPdf(plan)) {
      return err('Scale or Agency required for investor PDF.', 403)
    }
    await connectDB()
    const { id } = await params
    const location = await Location.findOne({ _id: id, userId: user._id }).lean()
    if (!location) return err('Location not found', 404)

    const locId = new mongoose.Types.ObjectId(String(location._id))
    const since = new Date()
    since.setDate(since.getDate() - 90)
    const velocity90d = await Review.countDocuments({ locationId: locId, reviewCreatedAt: { $gte: since } })

    const monthLabel = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })
    const bullets = [
      `Maintains ${(location.averageRating || 0).toFixed(2)}★ across ${location.totalReviews || 0} indexed Google reviews.`,
      `${velocity90d} new reviews in the last 90 days — velocity is ${velocity90d >= 8 ? 'healthy' : 'building'}.`,
      location.crisisMode ? 'Crisis mode was ON — confirm narrative with operator before external sharing.' : 'Operations in standard monitoring mode.',
    ]

    const buf = await buildInvestorReportBuffer({
      businessName: location.name,
      monthLabel,
      avgRating: location.averageRating || 0,
      totalReviews: location.totalReviews || 0,
      velocity90d,
      executiveBullets: bullets,
    })

    const filename = `investor-brief-${(location.locationSlug || id).replace(/[^\w-]/g, '')}.pdf`
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('PDF failed', 500)
  }
}
