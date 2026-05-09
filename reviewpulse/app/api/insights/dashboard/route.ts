import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { insightsAggregator } from '@/lib/insights-aggregator'

/**
 * GET /api/insights/dashboard
 * Get comprehensive dashboard insights
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const locationId = searchParams.get('locationId') || undefined
    const days = parseInt(searchParams.get('days') || '30')

    // Generate insights
    const insights = await insightsAggregator.generateDashboardInsights(
      session.user.id,
      locationId,
      days
    )

    return NextResponse.json({
      success: true,
      data: insights,
    })
  } catch (error) {
    console.error('Insights API error:', error)
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
  }
}

/**
 * POST /api/insights/export
 * Export insights as PDF or CSV
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { locationId, format = 'pdf', days = 30 } = body

    // Get insights data
    const insights = await insightsAggregator.generateDashboardInsights(
      session.user.id,
      locationId,
      days
    )

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: insights,
      })
    }

    // For PDF/CSV, return a download URL or base64 (simplified)
    return NextResponse.json({
      success: true,
      message: 'Export generated',
      format,
      // In production, generate actual PDF/CSV and return download link
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 })
  }
}
