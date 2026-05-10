'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function DeveloperApiPage() {
  const [masked, setMasked] = useState<string | null>(null)
  const [hasKey, setHasKey] = useState(false)
  const [planOk, setPlanOk] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/user/public-api-key')
      const j = await res.json().catch(() => ({}))
      if (res.ok) {
        setMasked(j?.data?.masked || null)
        setHasKey(Boolean(j?.data?.hasKey))
        setPlanOk(Boolean(j?.data?.planOk))
      }
    })()
  }, [])

  const rotate = async () => {
    setNewKey(null)
    const res = await fetch('/api/user/public-api-key', { method: 'POST' })
    const j = await res.json().catch(() => ({}))
    if (res.ok) {
      setNewKey(j?.data?.apiKey || null)
      setHasKey(true)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold">Public API (G1)</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Bearer <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">rp_live_…</code> —{' '}
        <code className="text-xs">GET /api/v1/locations/&lt;id&gt;/reviews</code>
      </p>
      {!planOk ? <p className="mt-4 text-sm text-amber-800">Growth+ required to mint keys.</p> : null}
      {hasKey && masked ? <p className="mt-4 text-sm">Current key (masked): {masked}</p> : null}
      {newKey ? (
        <p className="mt-4 break-all rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          New key (copy now): {newKey}
        </p>
      ) : null}
      <Button type="button" className="mt-4" disabled={!planOk} onClick={() => void rotate()}>
        {hasKey ? 'Rotate API key' : 'Create API key'}
      </Button>
    </div>
  )
}
