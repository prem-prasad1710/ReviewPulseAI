'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Clock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function LocationReplySchedulePage() {
  const params = useParams()
  const id = String(params.id)
  const [loading, setLoading] = useState(true)
  const [planOk, setPlanOk] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [startHour, setStartHour] = useState(9)
  const [endHour, setEndHour] = useState(18)
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6])
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [festiveAutoMode, setFestiveAutoMode] = useState(true)

  useEffect(() => {
    const run = async () => {
      const res = await fetch(`/api/locations/${id}/reply-schedule`)
      const json = await res.json()
      const rs = json?.data?.replySchedule
      setPlanOk(Boolean(json?.data?.planOk))
      if (rs) {
        setEnabled(Boolean(rs.enabled))
        setStartHour(rs.startHour ?? 9)
        setEndHour(rs.endHour ?? 18)
        setWorkingDays(Array.isArray(rs.workingDays) ? rs.workingDays : [1, 2, 3, 4, 5, 6])
        setTimezone(rs.timezone || 'Asia/Kolkata')
      }
      const locRes = await fetch(`/api/locations/${id}`)
      const locJson = await locRes.json()
      const festive = locJson?.data?.festiveAutoMode
      setFestiveAutoMode(festive !== false)
      setLoading(false)
    }
    run()
  }, [id])

  const save = async () => {
    const res = await fetch(`/api/locations/${id}/reply-schedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, startHour, endHour, workingDays, timezone }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json?.error || 'Save failed')
      return
    }
    toast.success('Reply schedule saved')
  }

  const saveFestive = async () => {
    const res = await fetch(`/api/locations/${id}/meta`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ festiveAutoMode }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json?.error || 'Save failed')
      return
    }
    toast.success('Reply settings saved')
  }

  const toggleDay = (d: number) => {
    setWorkingDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <Link href="/locations" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Locations
      </Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Feature 9</p>
        <h1 className="font-heading mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
          <Clock className="h-7 w-7 text-indigo-600" />
          Smart Reply Scheduler
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          When enabled, AI drafts queue for publication inside business hours (Growth &amp; Scale).
        </p>
      </div>

      {!planOk ? (
        <Card className="border-amber-200/80 bg-amber-50/60 p-6 dark:border-amber-800/50 dark:bg-amber-950/30">
          <CardTitle className="text-base">Upgrade to Growth or Scale</CardTitle>
          <CardDescription>Reply scheduling is not available on Free or Starter.</CardDescription>
        </Card>
      ) : null}

      <Card className="space-y-4 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-base">Reply settings — Festive autopilot</CardTitle>
        </div>
        <CardDescription>
          During Indian festivals, positive replies may include a brief culturally appropriate greeting when it fits naturally.
        </CardDescription>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={festiveAutoMode} onChange={(e) => setFestiveAutoMode(e.target.checked)} />
          Enable festive tone for 3★+ replies
        </label>
        <Button className="rounded-xl" variant="secondary" onClick={() => void saveFestive()}>
          Save festive setting
        </Button>
      </Card>

      <Card className="space-y-4 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={enabled} disabled={!planOk} onChange={(e) => setEnabled(e.target.checked)} />
          Enable scheduler for this location
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Start hour</p>
            <input
              type="number"
              min={0}
              max={23}
              value={startHour}
              disabled={!planOk}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">End hour</p>
            <input
              type="number"
              min={0}
              max={23}
              value={endHour}
              disabled={!planOk}
              onChange={(e) => setEndHour(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Working days (0=Sun … 6=Sat)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {dayLabels.map((label, d) => (
              <Button
                key={label}
                type="button"
                size="sm"
                variant={workingDays.includes(d) ? 'default' : 'outline'}
                className="rounded-xl"
                disabled={!planOk}
                onClick={() => toggleDay(d)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Timezone</p>
          <input
            value={timezone}
            disabled={!planOk}
            onChange={(e) => setTimezone(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
          />
        </div>
        <Button className="rounded-xl" disabled={!planOk} onClick={save}>
          Save schedule
        </Button>
      </Card>
    </div>
  )
}
