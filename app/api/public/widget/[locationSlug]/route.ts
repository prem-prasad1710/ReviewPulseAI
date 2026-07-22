import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { clientIp, redisRateLimitUnavailableResponse, requireRedisRateLimitInProduction } from '@/lib/client-ip'
import { publicWidgetLimiter } from '@/lib/rate-limit'
import Location from '@/models/Location'
import Review from '@/models/Review'

/** E5 — public JSON for embeddable “social proof” wall (rate-limited). */
export async function GET(request: Request, { params }: { params: Promise<{ locationSlug: string }> }) {
  try {
    if (requireRedisRateLimitInProduction() && !publicWidgetLimiter) {
      return redisRateLimitUnavailableResponse()
    }

    const { locationSlug: rawSlug } = await params
    const slug = decodeURIComponent(rawSlug || '').trim()

    if (publicWidgetLimiter) {
      const ip = clientIp(request)
      const { success } = await publicWidgetLimiter.limit(`widget:${ip}:${slug || 'x'}`)
      if (!success) {
        return NextResponse.json({ error: 'Rate limit' }, { status: 429 })
      }
    }

    if (!slug || slug.length > 120) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await connectDB()
    const loc = await Location.findOne({ locationSlug: slug, isActive: true })
      .select('name averageRating totalReviews')
      .lean()
    if (!loc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const top = await Review.find({ locationId: (loc as { _id: unknown })._id })
      .sort({ reviewCreatedAt: -1 })
      .limit(6)
      .select('reviewerName rating comment reviewCreatedAt')
      .lean()

    const reviews = top.map((r) => ({
      reviewerName: (r as { reviewerName?: string }).reviewerName || 'Customer',
      rating: (r as { rating: number }).rating,
      comment: String((r as { comment?: string }).comment || '').slice(0, 280),
      date: (r as { reviewCreatedAt?: Date }).reviewCreatedAt
        ? new Date((r as { reviewCreatedAt: Date }).reviewCreatedAt).toISOString().slice(0, 10)
        : '',
    }))

    return NextResponse.json(
      {
        name: (loc as { name: string }).name,
        averageRating: Number((loc as { averageRating?: number }).averageRating ?? 0),
        totalReviews: Number((loc as { totalReviews?: number }).totalReviews ?? 0),
        reviews,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (e) {
    console.error('public/widget:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
