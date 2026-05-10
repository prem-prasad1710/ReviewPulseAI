import { NextResponse } from 'next/server'
import { err } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { buildBattleCardBuffer } from '@/lib/battle-card-pdf'
import { planAllowsBattleCardPdf } from '@/lib/plan-access'
import Competitor from '@/models/Competitor'
import Location from '@/models/Location'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const plan = String(user.plan || '')
    if (!planAllowsBattleCardPdf(plan)) {
      return err('Growth or Scale required for battle card PDF.', 403)
    }
    await connectDB()
    const { id } = await params
    const location = await Location.findOne({ _id: id, userId: user._id }).lean()
    if (!location) return err('Location not found', 404)

    const comps = await Competitor.find({ locationId: location._id, userId: user._id })
      .sort({ lastAnalyzedAt: -1 })
      .limit(1)
      .lean()
    const rival = comps[0]

    const buf = await buildBattleCardBuffer({
      outletName: location.name,
      selfAvg: location.averageRating || 0,
      selfReviewCount: location.totalReviews || 0,
      selfPosThemes: [],
      selfNegThemes: [],
      rivalName: rival?.name,
      rivalPosThemes: rival?.themes?.positive || [],
      rivalNegThemes: rival?.themes?.negative || [],
    })

    const filename = `battle-card-${(location.locationSlug || id).replace(/[^\w-]/g, '')}.pdf`
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
