import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { autoReplyEngine } from '@/lib/auto-reply-engine'

/**
 * POST /api/auto-reply/generate
 * Generate AI reply to a review
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      businessName,
      businessCategory,
      reviewText,
      reviewRating,
      reviewerName,
      language,
      tone,
      sentiment,
      compliance,
    } = body

    // Validate required fields
    if (
      !businessName ||
      !reviewText ||
      !language ||
      !tone ||
      reviewRating === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate reply
    const reply = await autoReplyEngine.generateReply({
      businessName,
      businessCategory: businessCategory || 'General Services',
      reviewText,
      reviewRating,
      reviewerName: reviewerName || 'Valued Customer',
      language,
      tone,
      sentiment: sentiment || 'neutral',
      compliance,
    })

    return NextResponse.json({
      success: true,
      data: reply,
    })
  } catch (error) {
    console.error('Reply generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate reply' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auto-reply/variants
 * Generate multiple reply variants (A/B testing)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { businessName, businessCategory, reviewText, reviewRating, reviewerName, language, sentiment, compliance, count } = body

    if (!businessName || !reviewText || !language) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate variants
    const variants = await autoReplyEngine.generateReplyVariants(
      {
        businessName,
        businessCategory: businessCategory || 'General Services',
        reviewText,
        reviewRating,
        reviewerName: reviewerName || 'Valued Customer',
        language,
        tone: 'professional',
        sentiment: sentiment || 'neutral',
        compliance,
      },
      count || 3
    )

    return NextResponse.json({
      success: true,
      data: variants,
    })
  } catch (error) {
    console.error('Variants generation error:', error)
    return NextResponse.json({ error: 'Failed to generate variants' }, { status: 500 })
  }
}
