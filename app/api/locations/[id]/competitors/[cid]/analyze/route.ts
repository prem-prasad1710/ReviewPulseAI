import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { analyzeCompetitorThemes } from '@/lib/competitor-themes'
import { reviewTextsFromSnippets } from '@/lib/competitor-places-snapshot'
import { connectDB } from '@/lib/mongodb'
import { planAllowsCompetitorSpy } from '@/lib/plan-access'
import { refreshCompetitorPlacesSnapshot } from '@/lib/sync-competitors-snapshot'
import Competitor from '@/models/Competitor'
import Location from '@/models/Location'

/**
 * Theme analysis uses only MongoDB-cached Place review snippets (no Google Places on each click).
 * If a legacy row has no cache, we allow a single refresh here (still user-initiated, not page load).
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string; cid: string }> }) {
  try {
    const user = await requireAuth()
    if (!planAllowsCompetitorSpy(user.plan as string)) {
      return err('Competitor Review Spy is available on Growth and Scale plans.', 403)
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

    let texts = reviewTextsFromSnippets(competitor.cachedReviewSnippets)
    if (texts.length === 0) {
      const backfill = await refreshCompetitorPlacesSnapshot(String(competitor._id), user.plan as string)
      if (!backfill.ok) {
        return err(
          'No cached competitor reviews yet. Configure GOOGLE_PLACES_API_KEY and wait for the nightly Places sync, or try again after adding the competitor.',
          503
        )
      }
      const reloaded = await Competitor.findById(competitor._id)
      if (!reloaded) return err('Competitor not found', 404)
      texts = reviewTextsFromSnippets(reloaded.cachedReviewSnippets)
    }

    if (texts.length === 0) {
      return err('Google returned no public review snippets for this place — themes cannot be computed.', 400)
    }

    const themes = await analyzeCompetitorThemes(texts)

    competitor.themes = themes
    competitor.lastAnalyzedAt = new Date()
    await competitor.save()

    return ok({ themes: competitor.themes, lastAnalyzedAt: competitor.lastAnalyzedAt })
  } catch (error) {
    console.error('POST analyze competitor failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Analysis failed', 500)
  }
}
