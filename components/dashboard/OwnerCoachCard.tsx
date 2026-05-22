'use client'

import { useState } from 'react'
import { Lightbulb, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

export default function OwnerCoachCard() {
  const [tips, setTips] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch('/api/insights/owner-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(j?.error || 'Could not load coach')
        return
      }
      const list = j?.data?.tips
      setTips(Array.isArray(list) ? list.map((t: unknown) => String(t)) : [])
    } catch {
      setErr('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-emerald-200/80 bg-emerald-50/35 p-5 dark:border-emerald-700/35 dark:bg-emerald-950/25 sm:p-6">
      <div className="flex items-start gap-3">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-50">Owner coach</CardTitle>
          <CardDescription className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            Three operational improvements from your last 30 days of critical reviews (one AI pass).
          </CardDescription>
          {err ? <p className="mt-2 text-sm text-rose-600">{err}</p> : null}
          {tips ? (
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-800 dark:text-slate-200">
              {tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="mt-4 rounded-xl border-emerald-300/80 bg-white/90 dark:border-emerald-600 dark:bg-slate-900/60"
            disabled={loading}
            onClick={() => void load()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analysing…
              </>
            ) : (
              'Get this week’s 3 tips'
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
