import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { REPORT_URL_EMAIL_ONLY } from '@/lib/reports/constants'
import Location from '@/models/Location'

export async function GET() {
  try {
    const user = await requireAuth()
    await connectDB()
    const locations = await Location.find({ userId: user._id }).select('name reports').lean()
    const reports = locations.flatMap((loc) =>
      (loc.reports || []).map((r) => {
        const emailedOnly = r.url === REPORT_URL_EMAIL_ONLY
        return {
          locationName: loc.name,
          month: r.month,
          url: emailedOnly ? '' : r.url,
          emailedOnly,
          generatedAt: r.generatedAt,
        }
      })
    )
    reports.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    return ok({ reports })
  } catch (error) {
    console.error('GET reports/list failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load reports', 500)
  }
}
