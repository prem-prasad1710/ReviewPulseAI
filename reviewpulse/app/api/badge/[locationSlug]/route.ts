import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Location from '@/models/Location'

function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** H1 / G2 — public trust badge SVG (cached 1h). */
export async function GET(_request: Request, { params }: { params: Promise<{ locationSlug: string }> }) {
  try {
    const { locationSlug } = await params
    const slug = decodeURIComponent(locationSlug || '').trim()
    if (!slug || slug.length > 120) {
      return new NextResponse('Not found', { status: 404 })
    }

    await connectDB()
    const loc = await Location.findOne({ locationSlug: slug, isActive: true })
      .select('name averageRating totalReviews badgeImpressions _id')
      .lean()
    if (!loc) {
      return new NextResponse('Not found', { status: 404 })
    }

    void Location.updateOne({ _id: (loc as { _id: unknown })._id }, { $inc: { badgeImpressions: 1 } }).catch(() => {})

    const name = escXml(((loc as { name?: string })?.name || 'Business').slice(0, 40))
    const rating = Number((loc as { averageRating?: number })?.averageRating ?? 0).toFixed(1)
    const count = Number((loc as { totalReviews?: number })?.totalReviews ?? 0)

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="280" height="52" role="img" aria-label="ReviewPulse verified rating">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#312e81"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="10" fill="url(#bg)"/>
  <text x="14" y="22" fill="#c7d2fe" font-size="11" font-family="system-ui,Segoe UI,sans-serif">${name}</text>
  <text x="14" y="40" fill="#ffffff" font-size="15" font-weight="700" font-family="system-ui,Segoe UI,sans-serif">⭐ ${rating} · ${count} reviews · ReviewPulse</text>
</svg>`

    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (e) {
    console.error('badge svg failed:', e)
    return new NextResponse('Error', { status: 500 })
  }
}
