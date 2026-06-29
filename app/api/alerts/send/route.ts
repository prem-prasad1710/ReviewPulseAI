import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { auth } from '@/lib/auth'
import { processReviewAfterSync } from '@/lib/review-post-sync'
import { getDb } from '@/lib/mongodb'

/**
 * POST /api/alerts/send
 * Manually re-trigger post-sync alert pipeline for a review (WhatsApp/email via review-post-sync).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { locationId, reviewId } = body

    if (!locationId || !reviewId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const idStr = String(session.user.id)
    if (!ObjectId.isValid(idStr)) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }
    const uid = new ObjectId(idStr)
    const locStr = String(locationId)
    if (!ObjectId.isValid(locStr)) {
      return NextResponse.json({ error: 'Invalid location id' }, { status: 400 })
    }

    const db = await getDb()
    const reviewIdStr = String(reviewId)
    if (!ObjectId.isValid(reviewIdStr)) {
      return NextResponse.json({ error: 'Invalid review id' }, { status: 400 })
    }
    const rid = new ObjectId(reviewIdStr)
    const review = await db.collection('reviews').findOne({ _id: rid, userId: uid })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }
    if (String(review.locationId) !== locStr) {
      return NextResponse.json({ error: 'Location does not match this review' }, { status: 400 })
    }

    await processReviewAfterSync(rid, { isNewReview: true })

    return NextResponse.json({
      success: true,
      message: 'Alert pipeline triggered via review-post-sync',
      reviewId,
    })
  } catch (error) {
    console.error('Alert API error:', error)
    return NextResponse.json({ error: 'Failed to send alert' }, { status: 500 })
  }
}

/**
 * GET /api/alerts/config
 * Get user's alert configuration (WhatsApp toggle lives in /api/user/whatsapp).
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

    const config = {
      enableWhatsAppAlerts: user?.whatsappAlertsEnabled !== false,
      whatsappNumber: user?.whatsappNumber ?? null,
      whatsappAlertsSentToday: user?.whatsappAlertsSent ?? 0,
      minRatingThreshold: 2,
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
