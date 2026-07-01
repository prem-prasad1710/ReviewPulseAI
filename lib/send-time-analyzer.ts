import type { Types } from 'mongoose'
import Review from '@/models/Review'

export type HourBucket = 'night' | 'morning' | 'afternoon' | 'evening'

export type HeatmapCell = {
  /** 0 = Sunday … 6 = Saturday */
  day: number
  bucket: HourBucket
  count: number
  avgRating: number
  /** Composite quality score 0–1 (used for colour intensity) */
  score: number
}

export type SendTimeResult = {
  cells: HeatmapCell[]
  bestDay: number | null
  bestBucket: HourBucket | null
  bestAvgRating: number | null
  confidence: 'none' | 'low' | 'medium' | 'high'
  totalReviews: number
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000 // +05:30

function hourToBucket(h: number): HourBucket {
  if (h >= 0 && h < 6) return 'night'
  if (h >= 6 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  return 'evening'
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const BUCKET_LABELS: Record<HourBucket, string> = {
  night: 'midnight–6 AM',
  morning: '6–noon',
  afternoon: 'noon–6 PM',
  evening: '6–midnight',
}

export function formatRecommendation(
  day: number | null,
  bucket: HourBucket | null,
  rating: number | null,
  confidence: SendTimeResult['confidence']
): string {
  if (confidence === 'none' || day === null || bucket === null) {
    return 'Sync more reviews to unlock personalised timing recommendations.'
  }
  const dayName = DAY_NAMES[day]
  const timeLabel = BUCKET_LABELS[bucket]
  const stars = rating ? ` — avg ${rating.toFixed(1)}★` : ''
  const caveat = confidence === 'low' ? ' (based on limited data)' : ''
  return `Ask on ${dayName}s, ${timeLabel}${stars}${caveat}`
}

/**
 * Aggregate a location's review timestamps (IST) into a 7 × 4 heatmap and return
 * the best send-time recommendation.
 *
 * Uses up to 6 months of data, capped at 500 reviews for performance.
 */
export async function analyzeBestSendTime(
  locationId: string | Types.ObjectId
): Promise<SendTimeResult> {
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)

  const rows = await Review.aggregate<{
    _id: { day: number; hour: number }
    count: number
    totalRating: number
  }>([
    {
      $match: {
        locationId,
        reviewCreatedAt: { $gte: sixMonthsAgo },
        rating: { $exists: true },
      },
    },
    { $limit: 500 },
    {
      $addFields: {
        istTs: { $add: ['$reviewCreatedAt', IST_OFFSET_MS] },
      },
    },
    {
      $addFields: {
        // $dayOfWeek: 1=Sun…7=Sat → convert to 0-based
        istDay: { $subtract: [{ $dayOfWeek: '$istTs' }, 1] },
        istHour: { $hour: '$istTs' },
      },
    },
    {
      $group: {
        _id: { day: '$istDay', hour: '$istHour' },
        count: { $sum: 1 },
        totalRating: { $sum: '$rating' },
      },
    },
  ])

  // Roll hours into 4 buckets per day
  const keyMap = new Map<string, { count: number; totalRating: number }>()
  let totalReviews = 0

  for (const row of rows) {
    const bucket = hourToBucket(row._id.hour)
    const key = `${row._id.day}:${bucket}`
    const prev = keyMap.get(key) ?? { count: 0, totalRating: 0 }
    keyMap.set(key, {
      count: prev.count + row.count,
      totalRating: prev.totalRating + row.totalRating,
    })
    totalReviews += row.count
  }

  if (totalReviews === 0) {
    return { cells: [], bestDay: null, bestBucket: null, bestAvgRating: null, confidence: 'none', totalReviews: 0 }
  }

  const buckets: HourBucket[] = ['night', 'morning', 'afternoon', 'evening']
  const cells: HeatmapCell[] = []
  let maxScore = 0

  for (let day = 0; day < 7; day++) {
    for (const bucket of buckets) {
      const data = keyMap.get(`${day}:${bucket}`) ?? { count: 0, totalRating: 0 }
      const avgRating = data.count > 0 ? data.totalRating / data.count : 0
      // Score = count weight × rating quality
      const rawScore = data.count > 0 ? (data.count / totalReviews) * (avgRating / 5) : 0
      maxScore = Math.max(maxScore, rawScore)
      cells.push({ day, bucket, count: data.count, avgRating, score: rawScore })
    }
  }

  // Normalize scores 0–1
  if (maxScore > 0) {
    for (const cell of cells) {
      cell.score = cell.score / maxScore
    }
  }

  // Find best cell (must have at least 2 reviews)
  const eligible = cells.filter((c) => c.count >= 2).sort((a, b) => b.score - a.score)
  const best = eligible[0] ?? null

  const confidence =
    totalReviews < 5
      ? 'low'
      : totalReviews < 20
        ? 'medium'
        : 'high'

  return {
    cells,
    bestDay: best?.day ?? null,
    bestBucket: best?.bucket ?? null,
    bestAvgRating: best ? Math.round(best.avgRating * 10) / 10 : null,
    confidence,
    totalReviews,
  }
}
