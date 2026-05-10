import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { menuInsightModeForCategory, menuInsightsPageTitle } from '@/lib/menu-insight-helpers'
import { planAllowsMenuInsights } from '@/lib/plan-access'
import Location from '@/models/Location'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params

    const plan = String(user.plan || '')
    if (!planAllowsMenuInsights(plan)) {
      return err('Menu insights are available on the Scale plan.', 403)
    }

    const location = await Location.findOne({ _id: id, userId: user._id })
      .select('name category menuInsights menuInsightsManualAt')
      .lean()
    if (!location) return err('Location not found', 404)

    const mode = menuInsightModeForCategory(location.category)
    return ok({
      title: menuInsightsPageTitle(mode),
      mode,
      menuInsights: location.menuInsights || { items: [], lastRunAt: null },
      menuInsightsManualAt: location.menuInsightsManualAt || null,
    })
  } catch (error) {
    console.error('GET menu-insights failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load menu insights', 500)
  }
}
