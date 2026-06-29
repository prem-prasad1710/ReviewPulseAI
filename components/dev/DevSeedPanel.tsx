'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

export default function DevSeedPanel() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const run = async (purgeAll: boolean) => {
    setLoading(true)
    setErr(null)
    setMsg(null)
    try {
      const res = await fetch('/api/dev/seed-test-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purgeAll }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(typeof j?.error === 'string' ? j.error : `Request failed (${res.status})`)
        return
      }
      const d = j?.data
      const removed = d?.previousSeedRemoved
      setMsg(
        `${purgeAll ? `Removed ${removed?.deletedLocations ?? 0} old locations and ${removed?.deletedReviews ?? 0} reviews. ` : ''}` +
          `Loaded ${d?.locationsCreated ?? 0} locations, ${d?.reviewsCreated ?? 0} reviews. Plan: ${d?.plan ?? '?'}. ` +
          (d?.planUpdated ? 'Sign out and back in if the UI still shows the old plan.' : '')
      )
      router.refresh()
    } catch {
      setErr('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-amber-300/80 bg-amber-50/40 dark:border-amber-600/50 dark:bg-amber-950/30">
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
            <Database className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-base text-amber-950 dark:text-amber-50">Development: sample data</CardTitle>
            <CardDescription className="mt-1 text-sm text-amber-900/90 dark:text-amber-100/85">
              Inserts three test outlets and reviews (IDs prefixed with{' '}
              <code className="rounded bg-black/5 px-1 dark:bg-white/10">rp-seed-</code>). Use{' '}
              <strong>Reset &amp; reload</strong> to delete all old locations (dummy + real OAuth) and load fresh sample
              data. Requires <code className="rounded px-1">ALLOW_DEV_SEED=true</code> in{' '}
              <code className="rounded px-1">.env</code>.
            </CardDescription>
            {err ? <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{err}</p> : null}
            {msg ? <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300">{msg}</p> : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void run(true)}
            className="rounded-xl border-rose-300/80 bg-white/90 text-rose-800 hover:bg-rose-50 dark:border-rose-700 dark:bg-slate-900/60 dark:text-rose-200"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Working…
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Reset &amp; reload sample data
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void run(false)}
            className="rounded-xl border-amber-400/80 bg-white/90 dark:border-amber-600 dark:bg-slate-900/60"
          >
            Load sample data only
          </Button>
        </div>
      </div>
    </Card>
  )
}
