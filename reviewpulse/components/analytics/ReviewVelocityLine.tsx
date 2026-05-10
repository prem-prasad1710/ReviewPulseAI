'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type VelocityPoint = { day: string; count: number; avgRating: number }

export default function ReviewVelocityLine({ data }: { data: VelocityPoint[] }) {
  if (!data.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Sync reviews to see daily volume and average stars.</p>
  }

  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#64748b" />
          <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 10 }} stroke="#64748b" width={32} />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[1, 5]}
            tick={{ fontSize: 10 }}
            stroke="#64748b"
            width={32}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
            labelFormatter={(v) => `Day ${v}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="count"
            name="Reviews / day"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="avgRating"
            name="Avg ★"
            stroke="#059669"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
