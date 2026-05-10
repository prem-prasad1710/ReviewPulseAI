import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { recommendationForItem } from '@/lib/menu-insight-helpers'
import { planAllowsMenuInsights } from '@/lib/plan-access'
import Location from '@/models/Location'

function csvEscape(s: string): string {
  const t = s.replace(/"/g, '""')
  return `"${t}"`
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params

    const plan = String(user.plan || '')
    if (!planAllowsMenuInsights(plan)) {
      return NextResponse.json({ success: false, error: 'Menu export is available on the Scale plan.' }, { status: 403 })
    }

    const location = await Location.findOne({ _id: id, userId: user._id })
      .select('name menuInsights')
      .lean()
    if (!location) {
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 })
    }

    const items = location.menuInsights?.items || []
    const header = ['Item', 'Loved', 'Complaints', 'Recommendation', 'Sample quote']
    const lines = [header.join(',')]
    for (const it of items) {
      const rec = recommendationForItem(it.positiveCount, it.negativeCount)
      lines.push(
        [
          csvEscape(it.name),
          String(it.positiveCount),
          String(it.negativeCount),
          csvEscape(rec.label),
          csvEscape(it.sampleQuote || ''),
        ].join(',')
      )
    }
    const csv = lines.join('\n')
    const safe = (location.name || 'menu-insights').replace(/[^\w\s-]/g, '').trim().slice(0, 48) || 'export'

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safe}-menu-insights.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    console.error('GET menu-insights/export failed:', error)
    return NextResponse.json({ success: false, error: 'Export failed' }, { status: 500 })
  }
}
