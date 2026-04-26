'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

interface Point {
  day: string
  avgRating: number
}

export default function SentimentChart({ data }: { data: Point[] }) {
  const hasData = data.length > 0

  return (
    <Card className="border-slate-200/80">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">Weekly Rating Trend</CardTitle>
          <CardDescription>Track sentiment movement over time</CardDescription>
        </div>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
          Last 7 points
        </span>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
            <defs>
              <linearGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis
              domain={[1, 5]}
              tickCount={5}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip
              cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
              contentStyle={{
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
              }}
              formatter={(value) => [`${value} / 5`, 'Avg rating']}
            />
            <Area type="monotone" dataKey="avgRating" stroke="#2563eb" strokeWidth={2.5} fill="url(#ratingFill)" />
          </AreaChart>
        </ResponsiveContainer>

        {!hasData && (
          <div className="-mt-44 flex h-44 items-center justify-center">
            <p className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 shadow-sm">
              No trend data yet. New reviews will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
