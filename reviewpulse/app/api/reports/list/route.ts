import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import Location from '@/models/Location'

export async function GET() {
  try {
    const user = await requireAuth()
    await connectDB()
    const locations = await Location.find({ userId: user._id }).select('name reports').lean()
    const reports = locations.flatMap((loc) =>
      (loc.reports || []).map((r) => ({
        locationName: loc.name,
        month: r.month,
        url: r.url,
        generatedAt: r.generatedAt,
      }))
    )
    reports.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    return ok({ reports })
  } catch (error) {
    console.error('GET reports/list failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load reports', 500)
  }
}
