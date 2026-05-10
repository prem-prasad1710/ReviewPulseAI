import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sentimentAnalyzer } from '@/lib/multilingual-sentiment'

/**
 * POST /api/sentiment/analyze
 * Analyze sentiment of review text
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, language } = body

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Review text is required' }, { status: 400 })
    }

    // Analyze sentiment
    const result = await sentimentAnalyzer.analyzeReview(text, language)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Sentiment analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze sentiment' }, { status: 500 })
  }
}

/**
 * POST /api/sentiment/batch
 * Analyze multiple reviews efficiently
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reviews } = body as { reviews: Array<{ id: string; text: string }> }

    if (!Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({ error: 'Reviews array is required' }, { status: 400 })
    }

    // Analyze batch
    const results = await sentimentAnalyzer.analyzeBatch(reviews)

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error('Batch sentiment analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze batch' }, { status: 500 })
  }
}
