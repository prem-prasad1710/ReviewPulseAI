'use client'

import { useEffect, useState } from 'react'
import { Clock, Loader2, TrendingUp } from 'lucide-react'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

type HourBucket = 'night' | 'morning' | 'afternoon' | 'evening'

type HeatmapCell = {
  day: number
  bucket: HourBucket
  count: number
  avgRating: number
  score: number
}

type AnalysisResult = {
  cells: HeatmapCell[]
  bestDay: number | null
  bestBucket: HourBucket | null
  bestAvgRating: number | null
  confidence: 'none' | 'low' | 'medium' | 'high'
  totalReviews: number
  recommendation: string
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const BUCKET_LABELS: Record<HourBucket, string> = {
  night: '🌙 Night',
  morning: '🌅 Morning',
  afternoon: '☀️ Afternoon',
  evening: '🌆 Evening',
}

function scoreToColor(score: number, isBest: boolean): string {
  if (isBest) return 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-1'
  if (score === 0) return 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500'
  if (score < 0.25) return 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
  if (score < 0.5) return 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200'
  if (score < 0.75) return 'bg-indigo-300 dark:bg-indigo-700/70 text-indigo-900 dark:text-indigo-100'
  return 'bg-indigo-500 text-white'
}

export default function SendTimeHeatmap({ locationId }: { locationId: string }) {
  const [data, setData] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/locations/${locationId}/send-time-analysis`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.data) setData(json.data as AnalysisResult)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [locationId])

  const buckets: HourBucket[] = ['morning', 'afternoon', 'evening', 'night']

  const getCell = (day: number, bucket: HourBucket): HeatmapCell | undefined =>
    data?.cells.find((c) => c.day === day && c.bucket === bucket)

  return (
    <Card className="space-y-4 p-6 dark:border-slate-700 dark:bg-slate-900/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-indigo-500" />
            Best Time to Ask for Reviews
          </CardTitle>
          <CardDescription className="mt-1">
            Based on when your customers leave the highest-rated reviews
          </CardDescription>
        </div>
        {data?.confidence && data.confidence !== 'none' && (
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            data.confidence === 'high' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
            data.confidence === 'medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {data.confidence === 'high' ? '✓ High confidence' : data.confidence === 'medium' ? '~ Medium confidence' : '△ Limited data'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
        </div>
      ) : !data || data.confidence === 'none' ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800/40">
          Sync your reviews first — this heatmap will appear once we have enough data.
        </p>
      ) : (
        <>
          {/* Recommendation banner */}
          <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 dark:border-indigo-800/60 dark:bg-indigo-950/30">
            <TrendingUp className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
              {data.recommendation}
            </p>
          </div>

          {/* Heatmap grid */}
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-center text-xs">
              <thead>
                <tr>
                  <th className="w-20 py-1 text-left text-slate-500" />
                  {DAY_SHORT.map((d) => (
                    <th key={d} className="py-1 font-medium text-slate-500 dark:text-slate-400">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {buckets.map((bucket) => (
                  <tr key={bucket}>
                    <td className="py-1 pr-3 text-left font-medium text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {BUCKET_LABELS[bucket]}
                    </td>
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                      const cell = getCell(day, bucket)
                      const isBest = data.bestDay === day && data.bestBucket === bucket
                      const score = cell?.score ?? 0
                      return (
                        <td key={day} className="py-0.5 px-0.5">
                          <div
                            title={cell?.count ? `${cell.count} review${cell.count !== 1 ? 's' : ''}, avg ${cell.avgRating.toFixed(1)}★` : 'No data'}
                            className={`mx-auto h-8 w-full max-w-[36px] rounded-lg flex flex-col items-center justify-center transition-transform hover:scale-105 cursor-default ${scoreToColor(score, isBest)}`}
                          >
                            {cell && cell.count > 0 ? (
                              <>
                                <span className="text-[10px] font-bold leading-none">{cell.count}</span>
                                <span className="text-[9px] leading-none opacity-80">{cell.avgRating.toFixed(1)}★</span>
                              </>
                            ) : (
                              <span className="text-[10px] opacity-40">—</span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Based on {data.totalReviews} review{data.totalReviews !== 1 ? 's' : ''} (IST). Darker = more reviews + higher rating.
          </p>
        </>
      )}
    </Card>
  )
}
