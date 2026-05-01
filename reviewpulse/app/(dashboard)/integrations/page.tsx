'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

type Loc = { _id: string; name?: string }

export default function IntegrationsPage() {
  const [locations, setLocations] = useState<Loc[]>([])
  const [sel, setSel] = useState('')
  const [z, setZ] = useState('disconnected')
  const [g, setG] = useState('disconnected')
  const [j, setJ] = useState('disconnected')

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/locations')
      const j = await res.json().catch(() => ({}))
      if (res.ok) {
        const list = (j?.data as Loc[]) || []
        setLocations(list)
        if (list[0]) setSel(String(list[0]._id))
      }
    })()
  }, [])

  useEffect(() => {
    if (!sel) return
    void (async () => {
      const res = await fetch(`/api/locations/${sel}/v2-settings`)
      const j = await res.json().catch(() => ({}))
      if (res.ok && j?.data?.integrations) {
        setZ(j.data.integrations.zomato || 'disconnected')
        setG(j.data.integrations.googleAds || 'disconnected')
        setJ(j.data.integrations.justdial || 'disconnected')
      }
    })()
  }, [sel])

  const save = async () => {
    await fetch(`/api/locations/${sel}/v2-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        integrations: { zomato: z as 'disconnected', googleAds: g as 'disconnected', justdial: j as 'disconnected' },
      }),
    })
    alert('Saved stub connector flags (E1–E3). Real OAuth sync is not bundled in this repo.')
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold">Integrations</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        E1 Zomato/Swiggy · E2 Google Ads · E3 Justdial/IndiaMart — status flags per outlet. Production would add OAuth and
        data pipelines.
      </p>
      <label className="mt-6 block text-xs font-semibold uppercase text-slate-500">Outlet</label>
      <select
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
        value={sel}
        onChange={(e) => setSel(e.target.value)}
      >
        {locations.map((l) => (
          <option key={l._id} value={l._id}>
            {l.name}
          </option>
        ))}
      </select>
      <div className="mt-4 space-y-3">
        <label className="block text-sm">
          Zomato / Swiggy
          <select className="mt-1 w-full rounded-lg border px-2 py-1 text-sm" value={z} onChange={(e) => setZ(e.target.value)}>
            <option value="disconnected">Disconnected</option>
            <option value="connected_stub">Connected (demo stub)</option>
            <option value="coming_soon">Coming soon</option>
          </select>
        </label>
        <label className="block text-sm">
          Google Ads
          <select className="mt-1 w-full rounded-lg border px-2 py-1 text-sm" value={g} onChange={(e) => setG(e.target.value)}>
            <option value="disconnected">Disconnected</option>
            <option value="connected_stub">Connected (demo stub)</option>
            <option value="coming_soon">Coming soon</option>
          </select>
        </label>
        <label className="block text-sm">
          Justdial / IndiaMart
          <select className="mt-1 w-full rounded-lg border px-2 py-1 text-sm" value={j} onChange={(e) => setJ(e.target.value)}>
            <option value="disconnected">Disconnected</option>
            <option value="connected_stub">Connected (demo stub)</option>
            <option value="coming_soon">Coming soon</option>
          </select>
        </label>
      </div>
      <Button className="mt-6" type="button" onClick={() => void save()}>
        Save
      </Button>
    </div>
  )
}
