'use client'

import { Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const COLORS = ['#22c55e', '#94a3b8', '#f43f5e']

export function ScoreLineChart({
  data,
}: {
  data: Array<{ label: string; avg: number }>
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} stroke="#94a3b8" width={28} />
          <Tooltip />
          <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2} dot={false} name="Avg rating" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ScorePieChart({
  data,
}: {
  data: Array<{ name: string; value: number }>
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} label>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
