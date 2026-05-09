import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { auth } from '@/lib/auth'
import { alertManager } from '@/lib/alerts'
import { getDb } from '@/lib/mongodb'

/**
 * POST /api/alerts/send
 * Send real-time alerts for low-rating reviews
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { locationId, reviewId, config } = body

    if (!locationId || !reviewId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get review details
    const db = await getDb()
    const reviewIdStr = String(reviewId)
    if (!ObjectId.isValid(reviewIdStr)) {
      return NextResponse.json({ error: 'Invalid review id' }, { status: 400 })
    }
    const rid = new ObjectId(reviewIdStr)
    const review = await db.collection('reviews').findOne({ _id: rid })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Prepare alert payload
    const alertPayload = {
      locationId,
      userId: session.user.id,
      reviewId,
      reviewerName: review.reviewerName || 'Anonymous',
      rating: review.rating,
      comment: review.comment || review.reviewText || 'No comment',
      sentiment: review.sentiment || 'neutral',
      language: review.detectedLanguage || 'english',
    }

    // Send alert
    const alertConfig = config || {
      enableEmailAlerts: true,
      enableSMSAlerts: false,
      minRatingThreshold: 2,
      channels: ['email'],
    }

    await alertManager.sendLowRatingAlert(alertPayload, alertConfig)

    return NextResponse.json({
      success: true,
      message: 'Alert sent successfully',
      reviewId,
    })
  } catch (error) {
    console.error('Alert API error:', error)
    return NextResponse.json({ error: 'Failed to send alert' }, { status: 500 })
  }
}

/**
 * GET /api/alerts/config
 * Get user's alert configuration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const idStr = String(session.user.id)
    if (!ObjectId.isValid(idStr)) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }
    const uid = new ObjectId(idStr)
    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: uid })

    const config = user?.alertConfig || {
      enableEmailAlerts: true,
      enableSMSAlerts: false,
      minRatingThreshold: 2,
      channels: ['email'],
      escalateAfterMinutes: 1440,
    }

    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error) {
    console.error('Get alert config error:', error)
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
  }
}
