import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Location from '@/models/Location'
import Review from '@/models/Review'

/** E4 — JSON-LD for LocalBusiness + aggregateRating (+ sample reviews). Public read. */
export async function GET(_request: Request, { params }: { params: Promise<{ locationSlug: string }> }) {
  try {
    const { locationSlug } = await params
    const slug = decodeURIComponent(locationSlug || '').trim()
    if (!slug || slug.length > 120) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await connectDB()
    const loc = await Location.findOne({ locationSlug: slug, isActive: true })
      .select('name address averageRating totalReviews')
      .lean()
    if (!loc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const top = await Review.find({ locationId: (loc as { _id: unknown })._id })
      .sort({ reviewCreatedAt: -1 })
      .limit(5)
      .select('reviewerName rating comment reviewCreatedAt')
      .lean()

    const avg = Number((loc as { averageRating?: number }).averageRating ?? 0)
    const total = Number((loc as { totalReviews?: number }).totalReviews ?? 0)

    const reviewBlocks = top
      .filter((r) => (r.comment || '').trim().length > 0)
      .map((r) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: (r as { reviewerName?: string }).reviewerName || 'Reviewer' },
        datePublished: (r as { reviewCreatedAt?: Date }).reviewCreatedAt
          ? new Date((r as { reviewCreatedAt: Date }).reviewCreatedAt).toISOString().slice(0, 10)
          : undefined,
        reviewBody: String((r as { comment?: string }).comment || '').slice(0, 5000),
        reviewRating: {
          '@type': 'Rating',
          ratingValue: (r as { rating: number }).rating,
          bestRating: 5,
          worstRating: 1,
        },
      }))

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: (loc as { name: string }).name,
      address: (loc as { address?: string }).address,
      aggregateRating:
        total > 0
          ? {
              '@type': 'AggregateRating',
              ratingValue: avg.toFixed(1),
              reviewCount: total,
              bestRating: '5',
              worstRating: '1',
            }
          : undefined,
      review: reviewBlocks.length ? reviewBlocks : undefined,
    }

    return NextResponse.json(schema, {
      headers: {
        'Content-Type': 'application/ld+json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (e) {
    console.error('schema json failed:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
