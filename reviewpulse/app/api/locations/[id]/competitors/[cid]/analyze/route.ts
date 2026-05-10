import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { analyzeCompetitorThemes } from '@/lib/competitor-themes'
import { fetchPlaceDetailsWithReviews } from '@/lib/places-details'
import { connectDB } from '@/lib/mongodb'
import { planAllowsCompetitorSpy } from '@/lib/plan-access'
import Competitor from '@/models/Competitor'
import Location from '@/models/Location'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string; cid: string }> }) {
  try {
    const user = await requireAuth()
    if (!planAllowsCompetitorSpy(user.plan as string)) {
      return err('Competitor Review Spy is available on Scale plan only.', 403)
    }
    await connectDB()
    const { id, cid } = await params
    const location = await Location.findOne({ _id: id, userId: user._id }).select('_id').lean()
    if (!location) return err('Location not found', 404)

    const competitor = await Competitor.findOne({ _id: cid, locationId: id, userId: user._id })
    if (!competitor) return err('Competitor not found', 404)

    const last = competitor.lastAnalyzedAt?.getTime() ?? 0
    if (last && Date.now() - last < 24 * 60 * 60 * 1000) {
      return err('Analysis can be refreshed at most once per 24 hours.', 429)
    }

    const details = await fetchPlaceDetailsWithReviews(competitor.placeId)
    const texts = (details?.reviews || []).map((r) => r.text || '').filter(Boolean)
    const themes = await analyzeCompetitorThemes(texts)

    competitor.themes = themes
    competitor.lastAnalyzedAt = new Date()
    if (details?.name) competitor.name = details.name
    if (details?.formatted_address) competitor.address = details.formatted_address
    await competitor.save()

    return ok({ themes: competitor.themes, lastAnalyzedAt: competitor.lastAnalyzedAt })
  } catch (error) {
    console.error('POST analyze competitor failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Analysis failed', 500)
  }
}
