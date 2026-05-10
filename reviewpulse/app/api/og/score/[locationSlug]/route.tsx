import { ImageResponse } from 'next/og'
import { connectDB } from '@/lib/mongodb'
import { computeReputationScore, letterGrade } from '@/lib/score-compute'
import Location from '@/models/Location'
import Review from '@/models/Review'
import User from '@/models/User'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locationSlug: string }> }
) {
  try {
    await connectDB()
    const { locationSlug } = await params
    const location = await Location.findOne({ locationSlug }).lean()
    if (!location) {
      return new Response('Not found', { status: 404 })
    }

    const reviews = await Review.find({ locationId: location._id }).lean()
    const total = reviews.length
    const replied = reviews.filter((r) => r.status === 'replied').length
    const replyRate = total > 0 ? replied / total : 0
    const positive = reviews.filter((r) => r.sentiment === 'positive').length
    const positiveRatio = total > 0 ? positive / total : 0
    const avgRating =
      total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : location.averageRating || 0
    const score = computeReputationScore({ averageRating: avgRating, replyRate, positiveRatio })
    const grade = letterGrade(score)

    const owner = await User.findById(location.userId).select('plan').lean()
    const isFree = (owner?.plan as string | undefined) === 'free'

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 48,
            background: 'linear-gradient(135deg,#1e1b4b,#312e81,#4338ca)',
            color: 'white',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          }}
        >
          <div style={{ fontSize: 28, opacity: 0.9 }}>Reputation score</div>
          <div style={{ fontSize: 56, fontWeight: 700, marginTop: 12 }}>{location.name}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, marginTop: 32 }}>
            <div style={{ fontSize: 96, fontWeight: 800 }}>{score}</div>
            <div style={{ fontSize: 48, fontWeight: 700, opacity: 0.95 }}>Grade {grade}</div>
          </div>
          {isFree ? (
            <div style={{ marginTop: 40, fontSize: 20, opacity: 0.85 }}>Powered by ReviewPulse</div>
          ) : null}
        </div>
      ),
      { width: 1200, height: 630 }
    )
  } catch (error) {
    console.error('OG score failed:', error)
    return new Response('Error', { status: 500 })
  }
}
