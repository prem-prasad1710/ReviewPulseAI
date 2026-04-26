'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

interface Point {
  day: string
  avgRating: number
}

export default function SentimentChart({ data }: { data: Point[] }) {
  return (
    <Card>
      <CardTitle>Weekly Rating Trend</CardTitle>
      <CardDescription className="mb-4">Track sentiment movement over time</CardDescription>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="day" />
            <YAxis domain={[1, 5]} />
            <Tooltip />
            <Line type="monotone" dataKey="avgRating" stroke="#2563EB" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
