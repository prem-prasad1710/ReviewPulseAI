import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { allowGoogleStaticMapForUser } from '@/lib/google-api-guards'
import { getGoogleMapsApiKey } from '@/lib/google-api-keys'
import { connectDB } from '@/lib/mongodb'
import Location from '@/models/Location'

const MAX_CENTER_LEN = 220

/**
 * Proxies Maps Static API so GOOGLE_MAPS_API_KEY stays server-only.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (!(await allowGoogleStaticMapForUser(String(user._id)))) {
      return new NextResponse('Too many requests', { status: 429 })
    }

    const key = getGoogleMapsApiKey()
    if (!key) {
      return new NextResponse('Maps not configured', { status: 503 })
    }

    await connectDB()
    const { id } = await params
    const location = await Location.findOne({ _id: id, userId: user._id }).select('address').lean()
    const center = location?.address?.trim().slice(0, MAX_CENTER_LEN)
    if (!location || !center) return new NextResponse('Not found', { status: 404 })

    const query =
      [
        ['center', center],
        ['zoom', '15'],
        ['size', '640x320'],
        ['scale', '2'],
        ['maptype', 'roadmap'],
        ['markers', `color:0x4f46e5|${center}`],
        ['key', key],
      ]
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')

    const upstream = await fetch(`https://maps.googleapis.com/maps/api/staticmap?${query}`, {
      next: { revalidate: 7200 },
    })

    if (!upstream.ok) {
      const snippet = await upstream.text().catch(() => '')
      console.error('Maps Static API:', upstream.status, snippet.slice(0, 240))
      return new NextResponse('Upstream error', { status: 502 })
    }

    const contentType = upstream.headers.get('content-type') || 'image/png'
    const buf = await upstream.arrayBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('GET map-thumb failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    return new NextResponse('Failed', { status: 500 })
  }
}
