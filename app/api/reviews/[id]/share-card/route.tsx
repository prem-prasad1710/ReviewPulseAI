import { ImageResponse } from 'next/og'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import Review from '@/models/Review'
import Location from '@/models/Location'

export const runtime = 'nodejs'

function stars(n: number): string {
  return '★'.repeat(Math.max(0, Math.min(5, n))) + '☆'.repeat(5 - Math.max(0, Math.min(5, n)))
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params

    const review = await Review.findOne({ _id: id, userId: user._id })
      .select('reviewerName rating comment locationId')
      .lean()
    if (!review) return new Response('Not found', { status: 404 })

    const location = await Location.findById(review.locationId).select('name').lean()
    const locationName = location?.name || 'Our Business'

    const reviewerFirst = (review.reviewerName || 'A Customer').split(' ')[0]
    const comment = (review.comment || '').slice(0, 200).trim()
    const displayComment = comment.length > 0 ? `"${comment}${review.comment && review.comment.length > 200 ? '…' : ''}"` : '"Great experience!"'
    const starStr = stars(review.rating)

    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e3a8a 100%)',
            display: 'flex',
            flexDirection: 'column',
            padding: '80px',
            fontFamily: 'sans-serif',
            position: 'relative',
          }}
        >
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex' }} />
          <div style={{ position: 'absolute', bottom: 40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex' }} />

          {/* ReviewPulse brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 60 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(99,102,241,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: 'white', fontSize: 20, display: 'flex' }}>★</div>
            </div>
            <span style={{ color: '#a5b4fc', fontSize: 18, fontWeight: 600, letterSpacing: 0.5, display: 'flex' }}>ReviewPulse</span>
          </div>

          {/* Business name */}
          <div style={{ color: '#c7d2fe', fontSize: 22, fontWeight: 500, marginBottom: 20, display: 'flex' }}>
            {locationName}
          </div>

          {/* Stars */}
          <div style={{ color: '#fbbf24', fontSize: 52, letterSpacing: 4, marginBottom: 32, display: 'flex' }}>
            {starStr}
          </div>

          {/* Review text */}
          <div style={{
            color: 'white',
            fontSize: review.comment && review.comment.length > 120 ? 30 : 38,
            fontWeight: 300,
            lineHeight: 1.45,
            flex: 1,
            maxWidth: 900,
            display: 'flex',
          }}>
            {displayComment}
          </div>

          {/* Reviewer + Google badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 22, fontWeight: 700 }}>
                {reviewerFirst.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'white', fontSize: 20, fontWeight: 600, display: 'flex' }}>{reviewerFirst}</span>
                <span style={{ color: '#93c5fd', fontSize: 14, display: 'flex' }}>Google Review</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: '10px 20px' }}>
              <div style={{ color: '#fbbf24', fontSize: 16, display: 'flex' }}>★</div>
              <span style={{ color: 'white', fontSize: 18, fontWeight: 600, display: 'flex' }}>{review.rating}.0</span>
              <span style={{ color: '#94a3b8', fontSize: 14, display: 'flex' }}>/ 5</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1080,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'private, max-age=86400',
        },
      }
    )
  } catch (e) {
    console.error('share-card:', e)
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return new Response('Unauthorized', { status: 401 })
    return new Response('Failed to generate card', { status: 500 })
  }
}
