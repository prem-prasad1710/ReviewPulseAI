'use client'

import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

interface Point {
  day: string
  avgRating: number
}

export default function SentimentChart({ data }: { data: Point[] }) {
  const hasData = data.length > 0
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'

  const chartPalette = useMemo(
    () =>
      isDark
        ? {
            grid: '#334155',
            tick: '#94a3b8',
            cursor: '#64748b',
            tooltipBg: 'rgba(15, 23, 42, 0.96)',
            tooltipBorder: 'rgba(51, 65, 85, 0.9)',
            tooltipShadow: '0 12px 40px rgba(0,0,0,0.45)',
            areaTop: '#818cf8',
            areaBottom: '#6366f1',
            areaFillOpacityHigh: 0.4,
            areaFillOpacityLow: 0.02,
            stroke: '#a5b4fc',
          }
        : {
            grid: '#e2e8f0',
            tick: '#64748b',
            cursor: '#94a3b8',
            tooltipBg: '#ffffff',
            tooltipBorder: '#e2e8f0',
            tooltipShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
            areaTop: '#6366f1',
            areaBottom: '#6366f1',
            areaFillOpacityHigh: 0.35,
            areaFillOpacityLow: 0.02,
            stroke: '#4f46e5',
          },
    [isDark]
  )

  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-slate-700/80 dark:shadow-black/15">
      <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 dark:border-slate-700/80 dark:bg-slate-800/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-heading text-lg">Rating trend</CardTitle>
            <CardDescription className="mt-1">Average rating by day (recent window)</CardDescription>
          </div>
          <span className="rounded-full border border-indigo-200/80 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-950/60 dark:text-indigo-200">
            Rolling view
          </span>
        </div>
      </div>

      <div className="p-4 pt-2">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient key={isDark ? 'd' : 'l'} id="ratingFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartPalette.areaTop} stopOpacity={chartPalette.areaFillOpacityHigh} />
                  <stop offset="100%" stopColor={chartPalette.areaBottom} stopOpacity={chartPalette.areaFillOpacityLow} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke={chartPalette.grid} strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fill: chartPalette.tick, fontSize: 12 }}
              />
              <YAxis
                domain={[1, 5]}
                tickCount={5}
                tickLine={false}
                axisLine={false}
                tick={{ fill: chartPalette.tick, fontSize: 12 }}
                width={36}
              />
              <Tooltip
                cursor={{ stroke: chartPalette.cursor, strokeDasharray: '4 4' }}
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: `1px solid ${chartPalette.tooltipBorder}`,
                  boxShadow: chartPalette.tooltipShadow,
                  backgroundColor: chartPalette.tooltipBg,
                  color: isDark ? '#e2e8f0' : '#0f172a',
                }}
                formatter={(value) => [`${value} / 5`, 'Avg rating']}
              />
              <Area type="monotone" dataKey="avgRating" stroke={chartPalette.stroke} strokeWidth={2.5} fill="url(#ratingFill)" />
            </AreaChart>
          </ResponsiveContainer>

          {!hasData && (
            <div className="-mt-44 flex h-44 items-center justify-center">
              <p className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                No chart data yet. Sync reviews to see your trend line.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
