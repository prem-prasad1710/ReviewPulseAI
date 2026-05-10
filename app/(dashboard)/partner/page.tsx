'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function PartnerPage() {
  const [code, setCode] = useState<string | null>(null)
  const [apply, setApply] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/user/referral')
      const j = await res.json().catch(() => ({}))
      if (res.ok) setCode(j?.data?.code || null)
    })()
  }, [])

  const submitApply = async () => {
    setMsg(null)
    const res = await fetch('/api/user/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: apply.trim() }),
    })
    const j = await res.json().catch(() => ({}))
    setMsg(res.ok ? 'Referral saved.' : j?.error || 'Failed')
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold">Partner program</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">H4 — share your code with another operator once.</p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/50">
        <p className="text-xs font-semibold uppercase text-slate-500">Your code</p>
        <p className="mt-1 font-mono text-lg font-bold">{code || '…'}</p>
      </div>
      <div className="mt-6">
        <label className="text-xs font-semibold uppercase text-slate-500">Apply someone&apos;s code</label>
        <input
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          value={apply}
          onChange={(e) => setApply(e.target.value)}
          placeholder="RP-ABC123"
        />
        <Button type="button" className="mt-2" onClick={() => void submitApply()}>
          Save
        </Button>
        {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
      </div>
    </div>
  )
}
