import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Location from '@/models/Location'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locationSlug: string }> }
) {
  try {
    await connectDB()
    const { locationSlug } = await params
    const loc = await Location.findOne({ locationSlug }).select('googlePlaceId _id').lean()
    if (!loc?.googlePlaceId) {
      const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(new URL('/', base), 302)
    }
    await Location.updateOne({ _id: loc._id }, { $inc: { qrScans: 1 } })
    const url = `https://search.google.com/local/writereview?placeid=${encodeURIComponent(loc.googlePlaceId)}`
    return NextResponse.redirect(url, 301)
  } catch (error) {
    console.error('GET /r/[locationSlug] failed:', error)
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(new URL('/', base), 302)
  }
}
